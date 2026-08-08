import type { D1Database } from '@cloudflare/workers-types'
import { createDB } from '@repo/database'

export const useDB = () => {
    const d1 = getCloudflareEnvironment<{ DB?: D1Database }>(useEvent()).DB

    if (!d1) throw createError({ statusCode: 500, statusMessage: 'D1 binding is not configured' })

    return createDB(d1)
}
