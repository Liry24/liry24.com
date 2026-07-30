import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import { createClient, type InValue } from '@libsql/client'

type SourceRow = Record<string, InValue>

interface ExportTable {
    source: string
    target: string
    sourceColumns: string[]
    targetColumns?: string[]
    transform?: (row: SourceRow) => InValue[]
}

const accountProviders = new Set<string>()

const tables: ExportTable[] = [
    {
        source: 'users',
        target: 'users',
        sourceColumns: [
            'id',
            'created_at',
            'updated_at',
            'name',
            'email',
            'email_verified',
            'image',
            'role',
            'banned',
            'ban_reason',
            'ban_expires',
        ],
    },
    {
        source: 'accounts',
        target: 'accounts',
        sourceColumns: [
            'id',
            'account_id',
            'provider_id',
            'user_id',
            'access_token',
            'refresh_token',
            'id_token',
            'access_token_expires_at',
            'refresh_token_expires_at',
            'scope',
            'password',
            'created_at',
            'updated_at',
        ],
        targetColumns: [
            'id',
            'issuer',
            'provider_account_id',
            'provider_id',
            'user_id',
            'access_token',
            'refresh_token',
            'id_token',
            'access_token_expires_at',
            'refresh_token_expires_at',
            'scope',
            'password',
            'created_at',
            'updated_at',
        ],
        transform: (row) => {
            if (typeof row.provider_id !== 'string')
                throw new Error('accounts.provider_id must be text')

            const providerId = row.provider_id
            accountProviders.add(providerId)

            return [
                row.id,
                `local:oauth:${providerId}`,
                row.account_id,
                row.provider_id,
                row.user_id,
                row.access_token,
                row.refresh_token,
                row.id_token,
                row.access_token_expires_at,
                row.refresh_token_expires_at,
                row.scope,
                row.password,
                row.created_at,
                row.updated_at,
            ]
        },
    },
    {
        source: 'passkeys',
        target: 'passkeys',
        sourceColumns: [
            'id',
            'created_at',
            'name',
            'public_key',
            'user_id',
            'credential_id',
            'counter',
            'device_type',
            'backed_up',
            'transports',
            'aaguid',
        ],
    },
    {
        source: 'socials',
        target: 'socials',
        sourceColumns: ['id', 'href', 'alias', 'icon', 'label', 'sortIndex'],
        targetColumns: ['id', 'href', 'alias', 'icon', 'label', 'sort_index'],
    },
    {
        source: 'careers',
        target: 'careers',
        sourceColumns: ['id', 'period', 'position', 'company', 'sortIndex'],
        targetColumns: ['id', 'period', 'position', 'company', 'sort_index'],
    },
    {
        source: 'works',
        target: 'works',
        sourceColumns: [
            'slug',
            'created_at',
            'title',
            'description',
            'category',
            'image',
            'icon',
            'href',
            'sortIndex',
        ],
        targetColumns: [
            'slug',
            'created_at',
            'title',
            'description',
            'category',
            'image',
            'icon',
            'href',
            'sort_index',
        ],
    },
    {
        source: 'arts',
        target: 'arts',
        sourceColumns: ['slug', 'created_at', 'title', 'description', 'href', 'sortIndex'],
        targetColumns: ['slug', 'created_at', 'title', 'description', 'href', 'sort_index'],
    },
    {
        source: 'art_images',
        target: 'art_images',
        sourceColumns: ['id', 'artSlug', 'src', 'alt'],
        targetColumns: ['id', 'art_slug', 'src', 'alt'],
    },
    {
        source: 'skills',
        target: 'skills',
        sourceColumns: ['id', 'name', 'icon', 'category', 'sortIndex'],
        targetColumns: ['id', 'name', 'icon', 'category', 'sort_index'],
    },
    {
        source: 'ranks',
        target: 'ranks',
        sourceColumns: ['id', 'game', 'season', 'rank', 'imageUrl', 'href', 'sortIndex'],
        targetColumns: ['id', 'game', 'season', 'rank', 'image_url', 'href', 'sort_index'],
    },
    {
        source: 'posts',
        target: 'posts',
        sourceColumns: ['slug', 'created_at', 'updated_at', 'title', 'content'],
    },
    {
        source: 'post_tags',
        target: 'post_tags',
        sourceColumns: ['postSlug', 'tag'],
        targetColumns: ['post_slug', 'tag'],
    },
]

const quoteIdentifier = (value: string) => `"${value.replaceAll('"', '""')}"`

const toSqlLiteral = (value: InValue | undefined): string => {
    if (value === null || value === undefined) return 'NULL'
    if (typeof value === 'boolean') return value ? '1' : '0'
    if (typeof value === 'bigint' || typeof value === 'number') return String(value)
    if (typeof value === 'string') return `'${value.replaceAll("'", "''")}'`

    const bytes =
        value instanceof ArrayBuffer
            ? new Uint8Array(value)
            : new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
    return `X'${Buffer.from(bytes).toString('hex')}'`
}

const getOutputPath = () => {
    const argument = Bun.argv.slice(2).find((value) => value.startsWith('--output='))
    return resolve(argument?.slice('--output='.length) || '.tmp/d1-import.sql')
}

const databaseUrl = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

if (!databaseUrl) throw new Error('TURSO_DATABASE_URL is required')
if (!databaseUrl.startsWith('file:') && !authToken)
    throw new Error('TURSO_AUTH_TOKEN is required for a remote Turso database')

const client = createClient({
    url: databaseUrl,
    ...(authToken ? { authToken } : {}),
})

const outputPath = getOutputPath()
const countsPath = outputPath.replace(/\.sql$/i, '-counts.json')
const statements: string[] = [
    '-- Data-only Turso export for the liry24-com D1 schema.',
    '-- Contains authentication secrets. Do not commit or share this file.',
]
const counts: Record<string, number> = {}

try {
    for (const table of tables) {
        const sourceColumns = table.sourceColumns.map(quoteIdentifier).join(', ')
        const result = await client.execute(
            `SELECT ${sourceColumns} FROM ${quoteIdentifier(table.source)}`,
        )
        const targetColumns = table.targetColumns || table.sourceColumns

        counts[table.target] = result.rows.length

        for (const sourceRow of result.rows as unknown as SourceRow[]) {
            const rowValues =
                table.transform?.(sourceRow) ||
                table.sourceColumns.map((column) => sourceRow[column] ?? null)

            if (rowValues.length !== targetColumns.length)
                throw new Error(`Column mapping mismatch for ${table.source}`)

            const values = rowValues.map(toSqlLiteral).join(', ')
            const statement = `INSERT INTO ${quoteIdentifier(table.target)} (${targetColumns.map(quoteIdentifier).join(', ')}) VALUES (${values});`

            if (Buffer.byteLength(statement, 'utf8') > 95_000)
                throw new Error(
                    `A ${table.source} row exceeds D1's SQL statement limit. Import that row through a bound D1PreparedStatement instead.`,
                )

            statements.push(statement)
        }
    }

    const unexpectedProviders = [...accountProviders].filter(
        (provider) => provider !== 'github' && provider !== 'vercel',
    )
    if (unexpectedProviders.length)
        throw new Error(`Unexpected OAuth providers: ${unexpectedProviders.join(', ')}`)

    await mkdir(dirname(outputPath), { recursive: true })
    await Bun.write(outputPath, `${statements.join('\n')}\n`)
    await Bun.write(countsPath, `${JSON.stringify(counts, null, 2)}\n`)

    console.log(`Wrote ${statements.length - 2} rows to ${outputPath}`)
    console.log(`Wrote table counts to ${countsPath}`)
} finally {
    client.close()
}
