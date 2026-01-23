import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'

import { relations } from '../../database/relations'
import * as schema from '../../database/schema'

const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
})

const db = drizzle({ client, schema, relations })
export { db, relations, schema }
