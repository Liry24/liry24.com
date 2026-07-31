import { access, mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const workspaceRoot = fileURLToPath(new URL('..', import.meta.url))
const dataRoot = resolve(workspaceRoot, '.data')
const defaultConfigPath = resolve(dataRoot, 'wrangler.dev.jsonc')
const activePersistPath = resolve(dataRoot, 'wrangler/state')
const activeStatePath = resolve(activePersistPath, 'v3')
const stagingPersistPath = resolve(dataRoot, 'wrangler-staging/state')
const stagingStatePath = resolve(stagingPersistPath, 'v3')
const backupRoot = resolve(dataRoot, 'wrangler-backup')
const exportPath = resolve(dataRoot, '.d1-remote-export.sql')
const exportCliPath = '.data/.d1-remote-export.sql'
const dataImportOrder = [
    'users',
    'accounts',
    'sessions',
    'verifications',
    'rate_limits',
    'passkeys',
    'jwks',
    'oauth_clients',
    'oauth_resources',
    'oauth_client_resources',
    'oauth_refresh_tokens',
    'oauth_access_tokens',
    'oauth_consents',
    'oauth_client_assertions',
    'socials',
    'careers',
    'works',
    'arts',
    'art_images',
    'skills',
    'ranks',
    'posts',
    'post_tags',
    'post_reviews',
    'post_review_jobs',
    'admin_action_plans',
    'admin_audit_events',
] as const

interface LocalWranglerConfigOptions {
    configPath?: string
    workerName?: string
    databaseName?: string
    databaseId?: string
    bucketName?: string
}

const toConfigPath = (configPath: string, targetPath: string) => {
    const path = relative(dirname(configPath), targetPath).split(sep).join('/')
    return path.startsWith('.') ? path : `./${path}`
}

export const writeLocalWranglerConfig = async ({
    configPath = defaultConfigPath,
    workerName = 'liry24-com-dev',
    databaseName = process.env.D1_NAME || 'liry24-com',
    databaseId = process.env.D1_ID || '00000000-0000-0000-0000-000000000000',
    bucketName = process.env.R2_BUCKET || 'liry24-com-local',
}: LocalWranglerConfigOptions = {}) => {
    const absoluteConfigPath = resolve(configPath)
    const config = {
        $schema: toConfigPath(
            absoluteConfigPath,
            resolve(workspaceRoot, 'node_modules/wrangler/config-schema.json'),
        ),
        name: workerName,
        main: toConfigPath(absoluteConfigPath, resolve(workspaceRoot, '.output/server/index.mjs')),
        compatibility_date: '2026-05-21',
        compatibility_flags: ['nodejs_compat'],
        d1_databases: [
            {
                binding: 'DB',
                database_name: databaseName,
                database_id: databaseId,
                migrations_dir: toConfigPath(absoluteConfigPath, resolve(workspaceRoot, 'drizzle')),
                migrations_pattern: toConfigPath(
                    absoluteConfigPath,
                    resolve(workspaceRoot, 'drizzle/*/migration.sql'),
                ),
            },
        ],
        r2_buckets: [
            {
                binding: 'R2',
                bucket_name: bucketName,
            },
        ],
    }

    await mkdir(dirname(absoluteConfigPath), { recursive: true })
    await writeFile(absoluteConfigPath, `${JSON.stringify(config, null, 4)}\n`, {
        encoding: 'utf8',
        mode: 0o600,
    })

    return absoluteConfigPath
}

const assertDataPath = (path: string) => {
    const relativePath = relative(dataRoot, resolve(path))

    if (relativePath.startsWith('..') || relativePath === '')
        throw new Error(`Refusing to modify a path outside the local data directory: ${path}`)
}

const runWrangler = async (args: string[], label: string) => {
    const child = Bun.spawn(['bun', 'x', 'wrangler', ...args], {
        cwd: workspaceRoot,
        env: process.env,
        stdout: 'pipe',
        stderr: 'pipe',
    })
    const [, , exitCode] = await Promise.all([
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
        child.exited,
    ])

    if (exitCode !== 0)
        throw new Error(
            `${label} failed with exit code ${exitCode}. Run the Wrangler command directly for diagnostics.`,
        )
}

const pathExists = async (path: string) => {
    try {
        await access(path)
        return true
    } catch {
        return false
    }
}

const removeDirectory = async (path: string) => {
    let lastError: unknown

    for (let attempt = 0; attempt < 6; attempt++) {
        try {
            await rm(path, { recursive: true, force: true })
            return
        } catch (error) {
            const code = (error as NodeJS.ErrnoException).code
            if (code !== 'EBUSY' && code !== 'EPERM') throw error

            lastError = error
            await new Promise((resolve) => setTimeout(resolve, 50 * 2 ** attempt))
        }
    }

    throw lastError
}

const splitSqlStatements = (source: string) => {
    const statements: string[] = []
    let statement = ''
    let inString = false

    for (let index = 0; index < source.length; index++) {
        const character = source[index]!
        statement += character

        if (character === "'") {
            if (inString && source[index + 1] === "'") {
                statement += source[++index]!
            } else {
                inString = !inString
            }
        } else if (character === ';' && !inString) {
            statements.push(statement.slice(0, -1))
            statement = ''
        }
    }

    if (inString) throw new Error('Remote D1 export contains an unterminated SQL string')
    if (statement.trim()) statements.push(statement)

    return statements
}

const prepareDataImport = async () => {
    const groups = new Map<string, string[]>(dataImportOrder.map((table) => [table, []]))
    const sequenceStatements: string[] = []
    const exportedSql = await readFile(exportPath, 'utf8')

    for (const rawStatement of splitSqlStatements(exportedSql)) {
        const statement = rawStatement.replace(/^(?:\s*--[^\r\n]*(?:\r?\n|$))+/, '').trim()

        if (!statement || /^PRAGMA\s+defer_foreign_keys\s*=/i.test(statement)) continue

        const insert = statement.match(/^INSERT INTO\s+["`]?([^"`\s(]+)["`]?/i)

        if (!insert?.[1])
            throw new Error('Remote D1 export contains an unsupported non-INSERT statement')

        const table = insert[1]

        if (table === 'd1_migrations') continue
        if (table === 'sqlite_sequence') {
            sequenceStatements.push(statement)
            continue
        }

        const tableStatements = groups.get(table)

        if (!tableStatements) throw new Error(`Remote D1 export contains unknown table "${table}"`)

        tableStatements.push(statement)
    }

    const statements = [
        ...dataImportOrder.flatMap((table) => groups.get(table)!),
        ...(sequenceStatements.length
            ? ['DELETE FROM sqlite_sequence', ...sequenceStatements]
            : []),
    ]

    await writeFile(exportPath, `${statements.map((statement) => `${statement};`).join('\n')}\n`, {
        encoding: 'utf8',
        mode: 0o600,
    })

    return statements.length
}

const verifyStagedD1 = async () => {
    const child = Bun.spawn(['bun', 'scripts/verify-local-d1.ts', stagingStatePath], {
        cwd: workspaceRoot,
        env: process.env,
        stdout: 'pipe',
        stderr: 'pipe',
    })
    const [, , exitCode] = await Promise.all([
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
        child.exited,
    ])

    if (exitCode !== 0) throw new Error('Staged local D1 integrity verification failed')
}

const replaceLocalD1 = async () => {
    const activeD1Path = resolve(activeStatePath, 'd1')
    const stagingD1Path = resolve(stagingStatePath, 'd1')
    const backupD1Path = resolve(backupRoot, 'd1')

    for (const path of [activeD1Path, stagingD1Path, backupD1Path]) assertDataPath(path)

    if (!(await pathExists(stagingD1Path)))
        throw new Error('Wrangler did not create a staged local D1 database')

    await mkdir(dirname(activeD1Path), { recursive: true })
    await rm(backupRoot, { recursive: true, force: true })

    const hadActiveDatabase = await pathExists(activeD1Path)

    if (hadActiveDatabase) {
        await mkdir(backupRoot, { recursive: true })
        await rename(activeD1Path, backupD1Path)
    }

    try {
        await rename(stagingD1Path, activeD1Path)
    } catch (error) {
        if (hadActiveDatabase && (await pathExists(backupD1Path)))
            await rename(backupD1Path, activeD1Path)

        throw error
    }

    try {
        await rm(backupRoot, { recursive: true, force: true })
    } catch {
        console.warn('Remote D1 was synced, but the ignored local backup could not be removed')
    }
}

const applyLocalMigrations = async (
    configPath: string,
    databaseName: string,
    persistPath: string,
) => {
    await mkdir(persistPath, { recursive: true })
    await runWrangler(
        [
            'd1',
            'migrations',
            'apply',
            databaseName,
            '--local',
            '--config',
            configPath,
            '--persist-to',
            persistPath,
        ],
        'Local D1 migration',
    )
}

const migrateLocal = async (configPath: string, databaseName: string) => {
    await applyLocalMigrations(configPath, databaseName, activePersistPath)
    console.log('Local D1 migrations applied')
}

const syncRemoteD1 = async (configPath: string, databaseName: string) => {
    for (const path of [stagingPersistPath, backupRoot, exportPath]) assertDataPath(path)

    await removeDirectory(stagingPersistPath)
    await rm(exportPath, { force: true })
    await mkdir(dirname(exportPath), { recursive: true })

    try {
        console.log(`Syncing remote D1 "${databaseName}" to the ignored local development state...`)
        await runWrangler(
            [
                'd1',
                'export',
                databaseName,
                '--remote',
                '--no-schema',
                '--skip-confirmation',
                '--output',
                exportCliPath,
            ],
            'Remote D1 export',
        )

        const exportedFile = await stat(exportPath)

        if (exportedFile.size === 0) throw new Error('Remote D1 export produced an empty file')

        const dataStatementCount = await prepareDataImport()
        await applyLocalMigrations(configPath, databaseName, stagingPersistPath)

        if (dataStatementCount)
            await runWrangler(
                [
                    'd1',
                    'execute',
                    databaseName,
                    '--local',
                    '--config',
                    configPath,
                    '--persist-to',
                    stagingPersistPath,
                    '--file',
                    exportPath,
                ],
                'Staged local D1 import',
            )

        await verifyStagedD1()
        await replaceLocalD1()
        console.log(
            'Remote D1 sync, migrations, and integrity checks completed; existing local R2 state was preserved',
        )
    } finally {
        await rm(exportPath, { force: true })
        try {
            await removeDirectory(stagingPersistPath)
        } catch {
            console.warn('The ignored staging D1 could not be removed after multiple attempts')
        }
    }
}

if (import.meta.main) {
    const databaseName = process.env.D1_NAME || 'liry24-com'
    const configPath = await writeLocalWranglerConfig({ databaseName })

    if (process.argv.includes('--migrate-only')) await migrateLocal(configPath, databaseName)
    else await syncRemoteD1(configPath, databaseName)
}
