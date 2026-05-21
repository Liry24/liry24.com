import type { Serialize, Simplify } from 'nitropack'

export type Serialized<T> = Simplify<Serialize<T>>

export interface ConsoleLog {
    createdAt: Date
    message: string
    type?: 'log' | 'warn' | 'error'
}

export { db, relations, schema } from '@repo/database'
export * from '@repo/database/types'
