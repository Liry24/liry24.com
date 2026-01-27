import type { Serialize, Simplify } from 'nitropack'

export type Serialized<T> = Simplify<Serialize<T>>
