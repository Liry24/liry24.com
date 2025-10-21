# AGENTS.md

## Stacks

Most of these are provided by MCP servers via Context7.

- Node.js v22
- Bun (Package Manager)
- TypeScript
- Astro
- Vue
- TailwindCSS v4
- TresJS (Three.js)
- Vercel

## Setup commands

- Install deps: `bun i`
- Start dev app: `bun dev`

## Code style

### TypeScript

- TypeScript strict mode
- Single quotes, no semicolons
- Use functional patterns where possible

### Vue

- Use the Composition API

## Notes

- Nuxt 4 uses auto-importing. Elements exported in the following directories do not need to be explicitly imported:
    - app/composables
    - app/components
    - app/utils
    - shared/types
    - shared/utils
    - Specific Nuxt modules
- Please make sure the following is in English.
    - console.log
    - console.error
    - console.warn
- If you find any potential bugs, please fix them accordingly and suggest them.
