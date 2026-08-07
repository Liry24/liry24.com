import type { D1Database } from '@cloudflare/workers-types'
import { drizzle } from 'drizzle-orm/d1'
import { useEvent } from 'nitropack/runtime'

import { getCloudflareEnvironment } from '../server/utils/cloudflareContext'
import { relations } from './relations'
import * as schema from './schema'

const createDB = (d1: D1Database) => drizzle(d1, { relations })

const useDB = () => {
    const d1 = getCloudflareEnvironment<{ DB: D1Database }>(useEvent()).DB
    return createDB(d1)
}

type Database = ReturnType<typeof useDB>

// Database bindings are request-scoped in Nitro. Keep the existing `db` API while
// resolving the current request's D1 binding for every operation.
const db = new Proxy({} as Database, {
    get(_target, property) {
        if (property === 'then') return undefined

        const database = useDB()
        const value = Reflect.get(database, property, database)

        return typeof value === 'function' ? value.bind(database) : value
    },
})

export { createDB, db, relations, schema, useDB }
export type { Database }
