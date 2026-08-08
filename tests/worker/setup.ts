import { applyD1Migrations, env } from 'cloudflare:test'

declare module 'cloudflare:workers' {
    interface ProvidedEnv {
        DB: D1Database
        TEST_MIGRATIONS: { name: string; queries: string[] }[]
    }
}

await applyD1Migrations(env.DB, env.TEST_MIGRATIONS)
