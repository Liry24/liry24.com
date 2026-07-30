import { mkdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import { createClient } from '@libsql/client'
import { getPlatformProxy } from 'wrangler'

import { writeLocalWranglerConfig } from './sync-d1-to-local'

const fixtureRoot = resolve('.tmp/d1-migration-fixture')
const sourcePath = resolve(fixtureRoot, 'turso.db')
const outputPath = resolve(fixtureRoot, 'd1-import.sql')
const persistPath = resolve(fixtureRoot, 'wrangler-state')
const statePath = resolve(persistPath, 'v3')
const configPath = resolve(fixtureRoot, 'wrangler.jsonc')
const databaseName = 'liry24-com-fixture'

const assert = (condition: unknown, message: string): asserts condition => {
    if (!condition) throw new Error(message)
}

const run = async (command: string[], env: Record<string, string | undefined> = process.env) => {
    const child = Bun.spawn(command, {
        cwd: resolve('.'),
        env,
        stdout: 'pipe',
        stderr: 'pipe',
    })
    const [stdout, stderr, exitCode] = await Promise.all([
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
        child.exited,
    ])

    if (exitCode !== 0)
        throw new Error(
            `Command failed (${command.join(' ')}):\n${stdout.slice(-4_000)}\n${stderr.slice(-4_000)}`,
        )
}

await rm(fixtureRoot, { recursive: true, force: true })
await mkdir(fixtureRoot, { recursive: true })
await writeLocalWranglerConfig({
    configPath,
    workerName: 'liry24-com-d1-fixture',
    databaseName,
    databaseId: '00000000-0000-0000-0000-000000000001',
    bucketName: 'liry24-com-fixture',
})

const source = createClient({ url: pathToFileURL(sourcePath).href })

try {
    await source.executeMultiple(`
        CREATE TABLE users (
            id TEXT PRIMARY KEY, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
            name TEXT NOT NULL, email TEXT NOT NULL, email_verified INTEGER NOT NULL,
            image TEXT, role TEXT, banned INTEGER, ban_reason TEXT, ban_expires INTEGER
        );
        CREATE TABLE accounts (
            id TEXT PRIMARY KEY, account_id TEXT NOT NULL, provider_id TEXT NOT NULL,
            user_id TEXT NOT NULL, access_token TEXT, refresh_token TEXT, id_token TEXT,
            access_token_expires_at INTEGER, refresh_token_expires_at INTEGER, scope TEXT,
            password TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
        );
        CREATE TABLE passkeys (
            id TEXT PRIMARY KEY, created_at INTEGER, name TEXT, public_key TEXT NOT NULL,
            user_id TEXT NOT NULL, credential_id TEXT NOT NULL, counter INTEGER NOT NULL,
            device_type TEXT NOT NULL, backed_up INTEGER NOT NULL, transports TEXT, aaguid TEXT
        );
        CREATE TABLE socials (
            id INTEGER PRIMARY KEY, href TEXT NOT NULL, alias TEXT, icon TEXT NOT NULL,
            label TEXT NOT NULL, sortIndex INTEGER NOT NULL
        );
        CREATE TABLE careers (
            id INTEGER PRIMARY KEY, period TEXT NOT NULL, position TEXT NOT NULL,
            company TEXT NOT NULL, sortIndex INTEGER NOT NULL
        );
        CREATE TABLE works (
            slug TEXT PRIMARY KEY, created_at INTEGER NOT NULL, title TEXT NOT NULL,
            description TEXT, category TEXT, image TEXT, icon TEXT, href TEXT,
            sortIndex INTEGER NOT NULL
        );
        CREATE TABLE arts (
            slug TEXT PRIMARY KEY, created_at INTEGER NOT NULL, title TEXT NOT NULL,
            description TEXT, href TEXT, sortIndex INTEGER NOT NULL
        );
        CREATE TABLE art_images (
            id INTEGER PRIMARY KEY, artSlug TEXT NOT NULL, src TEXT NOT NULL, alt TEXT
        );
        CREATE TABLE skills (
            id INTEGER PRIMARY KEY, name TEXT NOT NULL, icon TEXT NOT NULL,
            category TEXT, sortIndex INTEGER NOT NULL
        );
        CREATE TABLE ranks (
            id INTEGER PRIMARY KEY, game TEXT NOT NULL, season TEXT, rank TEXT NOT NULL,
            imageUrl TEXT NOT NULL, href TEXT, sortIndex INTEGER NOT NULL
        );
        CREATE TABLE posts (
            slug TEXT PRIMARY KEY, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
            title TEXT NOT NULL, content TEXT NOT NULL
        );
        CREATE TABLE post_tags (postSlug TEXT NOT NULL, tag TEXT NOT NULL);
    `)

    await source.batch(
        [
            {
                sql: `INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [
                    'user-1',
                    1_700_000_000_001,
                    1_700_000_000_002,
                    "O'Brien",
                    'fixture@example.com',
                    1,
                    null,
                    'admin',
                    0,
                    null,
                    null,
                ],
            },
            {
                sql: `INSERT INTO accounts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [
                    'account-row-1',
                    'github-user-1',
                    'github',
                    'user-1',
                    "access-'token",
                    'refresh-token',
                    'id-token',
                    1_700_000_100_000,
                    null,
                    'read:user',
                    null,
                    1_700_000_000_003,
                    1_700_000_000_004,
                ],
            },
            {
                sql: `INSERT INTO passkeys VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [
                    'passkey-1',
                    1_700_000_000_005,
                    'Fixture key',
                    'public-key',
                    'user-1',
                    'credential-1',
                    7,
                    'singleDevice',
                    0,
                    'internal',
                    'aaguid-1',
                ],
            },
            {
                sql: `INSERT INTO socials VALUES (?, ?, ?, ?, ?, ?)`,
                args: [1, 'https://example.com', 'example', 'simple-icons:example', 'Example', 1],
            },
            {
                sql: `INSERT INTO careers VALUES (?, ?, ?, ?, ?)`,
                args: [1, '2025-', 'Engineer', 'Example Inc.', 2],
            },
            {
                sql: `INSERT INTO works VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [
                    'fixture-work',
                    1_700_000_000_006,
                    'Fixture work',
                    null,
                    'web',
                    null,
                    null,
                    'https://example.com/work',
                    3,
                ],
            },
            {
                sql: `INSERT INTO arts VALUES (?, ?, ?, ?, ?, ?)`,
                args: ['fixture-art', 1_700_000_000_007, 'Fixture art', 'Line 1\nLine 2', null, 4],
            },
            {
                sql: `INSERT INTO art_images VALUES (?, ?, ?, ?)`,
                args: [1, 'fixture-art', 'https://example.com/art.png', null],
            },
            {
                sql: `INSERT INTO skills VALUES (?, ?, ?, ?, ?)`,
                args: [1, 'TypeScript', 'simple-icons:typescript', null, 5],
            },
            {
                sql: `INSERT INTO ranks VALUES (?, ?, ?, ?, ?, ?, ?)`,
                args: [1, 'Fixture Game', null, 'Gold', '/rank.png', null, 6],
            },
            {
                sql: `INSERT INTO posts VALUES (?, ?, ?, ?, ?)`,
                args: [
                    'fixture-post',
                    1_700_000_000_008,
                    1_700_000_000_009,
                    "A quoted 'title'",
                    "First line\nSecond line with 'quotes'",
                ],
            },
            {
                sql: `INSERT INTO post_tags VALUES (?, ?)`,
                args: ['fixture-post', 'migration'],
            },
        ],
        'write',
    )
} finally {
    source.close()
}

await run(['bun', 'scripts/export-turso-for-d1.ts', `--output=${outputPath}`], {
    ...process.env,
    TURSO_DATABASE_URL: pathToFileURL(sourcePath).href,
    TURSO_AUTH_TOKEN: undefined,
})
await run([
    'bun',
    'x',
    'wrangler',
    'd1',
    'migrations',
    'apply',
    databaseName,
    '--local',
    '--config',
    configPath,
    '--persist-to',
    persistPath,
])
await run([
    'bun',
    'x',
    'wrangler',
    'd1',
    'execute',
    databaseName,
    '--local',
    '--config',
    configPath,
    '--persist-to',
    persistPath,
    '--file',
    outputPath,
])

const databasePaths = [
    ...new Bun.Glob('**/*.sqlite').scanSync({
        cwd: statePath,
        absolute: true,
        onlyFiles: true,
    }),
].filter((path) => !path.endsWith('metadata.sqlite'))

assert(databasePaths.length === 1, 'Expected exactly one local D1 SQLite database')

const target = createClient({ url: pathToFileURL(databasePaths[0]!).href })
const expectedTables = [
    'users',
    'accounts',
    'passkeys',
    'socials',
    'careers',
    'works',
    'arts',
    'art_images',
    'skills',
    'ranks',
    'posts',
    'post_tags',
] as const
const emptyAuthTables = ['sessions', 'verifications', 'rate_limits'] as const

try {
    const exportedCounts = (await Bun.file(
        outputPath.replace(/\.sql$/i, '-counts.json'),
    ).json()) as Record<string, number>

    for (const table of expectedTables) {
        assert(exportedCounts[table] === 1, `Unexpected exported ${table} count`)
        const result = await target.execute(`SELECT count(*) AS count FROM "${table}"`)
        assert(Number(result.rows[0]?.count) === 1, `Unexpected imported ${table} count`)
    }

    for (const table of emptyAuthTables) {
        const result = await target.execute(`SELECT count(*) AS count FROM "${table}"`)
        assert(Number(result.rows[0]?.count) === 0, `Expected an empty ${table} table`)
    }

    const account = (await target.execute(`SELECT issuer, provider_account_id FROM accounts`))
        .rows[0]
    assert(account?.issuer === 'local:oauth:github', 'Account issuer conversion failed')
    assert(account.provider_account_id === 'github-user-1', 'Provider account conversion failed')

    const user = (await target.execute(`SELECT name, image FROM users`)).rows[0]
    assert(user?.name === "O'Brien", 'Quoted user name did not round-trip')
    assert(user.image === null, 'NULL user image did not round-trip')

    const post = (await target.execute(`SELECT content, updated_at FROM posts`)).rows[0]
    assert(
        post?.content === "First line\nSecond line with 'quotes'",
        'Multiline post content did not round-trip',
    )
    assert(Number(post.updated_at) === 1_700_000_000_009, 'Post timestamp did not round-trip')

    const art = (await target.execute(`SELECT href FROM arts`)).rows[0]
    assert(art?.href === null, 'NULL art href did not round-trip')

    const foreignKeyCheck = await target.execute(`PRAGMA foreign_key_check`)
    assert(foreignKeyCheck.rows.length === 0, 'Imported fixture violates a foreign key')

    const integrityCheck = await target.execute(`PRAGMA integrity_check`)
    assert(integrityCheck.rows[0]?.integrity_check === 'ok', 'D1 integrity check failed')
} finally {
    target.close()
}

const proxy = await getPlatformProxy<{ DB: D1Database }>({
    configPath,
    persist: { path: statePath },
    remoteBindings: false,
})

try {
    await proxy.env.DB.exec(
        `CREATE TABLE batch_probe (id INTEGER PRIMARY KEY, value TEXT NOT NULL)`,
    )

    let batchFailed = false

    try {
        await proxy.env.DB.batch([
            proxy.env.DB.prepare(`INSERT INTO batch_probe VALUES (1, 'first')`),
            proxy.env.DB.prepare(`INSERT INTO batch_probe VALUES (1, 'duplicate')`),
        ])
    } catch {
        batchFailed = true
    }

    assert(batchFailed, 'Expected the constraint violation in the D1 batch to fail')

    const batchRollback = await proxy.env.DB.prepare(
        `SELECT count(*) AS count FROM batch_probe`,
    ).first<{ count: number }>()
    assert(batchRollback?.count === 0, 'D1 batch did not roll back the successful statement')
} finally {
    await proxy.dispose()
}

console.log('D1 migration fixture verified successfully')
