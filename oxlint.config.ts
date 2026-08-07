import { defineConfig } from 'oxlint'

export default defineConfig({
    plugins: ['import'],
    categories: {
        correctness: 'error',
    },
    options: {
        typeAware: true,
    },
    env: {
        builtin: true,
        browser: true,
        es2024: true,
        node: true,
    },
})
