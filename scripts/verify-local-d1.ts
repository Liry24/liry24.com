import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import { createClient } from '@libsql/client'

const statePath = Bun.argv[2]

if (!statePath) throw new Error('A Wrangler D1 state path is required')

const databasePaths = [
    ...new Bun.Glob('**/*.sqlite').scanSync({
        cwd: resolve(statePath, 'd1'),
        absolute: true,
        onlyFiles: true,
    }),
].filter((path) => !path.endsWith('metadata.sqlite'))

if (databasePaths.length !== 1) throw new Error('Expected exactly one local D1 SQLite database')

const client = createClient({ url: pathToFileURL(databasePaths[0]!).href })

try {
    const foreignKeyCheck = await client.execute('PRAGMA foreign_key_check')
    if (foreignKeyCheck.rows.length) throw new Error('Local D1 contains a foreign key violation')

    const integrityCheck = await client.execute('PRAGMA integrity_check')
    if (integrityCheck.rows[0]?.integrity_check !== 'ok')
        throw new Error('Local D1 failed its SQLite integrity check')
} finally {
    client.close()
}
