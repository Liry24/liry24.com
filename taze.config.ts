import { defineConfig } from 'taze'

export default defineConfig({
    force: true,
    write: true,
    install: false,
    recursive: true,
    ignorePaths: ['**/node_modules/**'],
    ignoreOtherWorkspaces: true,
    depFields: {
        overrides: false,
        'bun-workspace': true,
    },
})
