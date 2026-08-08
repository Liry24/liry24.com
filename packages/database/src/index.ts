import type { D1Database } from '@cloudflare/workers-types'
import { drizzle } from 'drizzle-orm/d1'

import { relations } from './relations'
import * as schema from './schema'

const createDB = (d1: D1Database) => drizzle(d1, { relations })

type Database = ReturnType<typeof createDB>

export { createDB, relations, schema }
export type { Database }
