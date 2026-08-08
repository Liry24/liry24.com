import { readdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { cloudflareTest } from '@cloudflare/vitest-pool-workers'
import { defineConfig } from 'vitest/config'

const root = dirname(fileURLToPath(import.meta.url))

const readWorkspaceMigrations = async () => {
    const drizzle = join(root, 'drizzle')
    const directories = await readdir(drizzle, { withFileTypes: true })
    const migrations = await Promise.all(
        directories
            .filter((entry) => entry.isDirectory())
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(async (entry) => {
                const sql = await readFile(join(drizzle, entry.name, 'migration.sql'), 'utf8')
                return {
                    name: entry.name,
                    queries: sql
                        .split('--> statement-breakpoint')
                        .map((query) => query.trim())
                        .filter(Boolean),
                }
            }),
    )
    return migrations
}

export default defineConfig({
    plugins: [
        cloudflareTest(async () => ({
            miniflare: {
                compatibilityDate: '2026-07-30',
                d1Databases: ['DB'],
                bindings: {
                    TEST_MIGRATIONS: await readWorkspaceMigrations(),
                },
            },
        })),
    ],
    test: {
        include: ['tests/worker/**/*.test.ts'],
        setupFiles: ['tests/worker/setup.ts'],
    },
})
