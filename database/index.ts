import { drizzle } from 'drizzle-orm/d1'
import { useEvent } from 'nitropack/runtime'

import { relations } from './relations'
import * as schema from './schema'

const useDB = () => {
    const d1 = useEvent().context.cloudflare.env.DB
    return drizzle(d1, { relations })
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

export { db, relations, schema, useDB }
