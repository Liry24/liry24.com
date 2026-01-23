<script setup lang="ts">
const colorMode = useColorMode()
const isLight = computed(() => colorMode.preference === 'light')

const logos = [
    'typescript',
    'nodejs',
    'bun',
    'vite',
    'rolldown',
    'oxc',
    'nuxt',
    'vue',
    'vueuse',
    'tailwindcss',
    isLight.value ? 'motion_light' : 'motion_dark',
    isLight.value ? 'turso-light' : 'turso-dark',
    isLight.value ? 'drizzle-orm_light' : 'drizzle-orm_dark',
    isLight.value ? 'better-auth_light' : 'better-auth_dark',
    'zod',
    isLight.value ? 'github_light' : 'github_dark',
    isLight.value ? 'vercel_light' : 'vercel_dark',
    'antigravity',
    'raycast',
    'svgl',
]
</script>

<template>
    <UModal :ui="{ content: 'p-8 flex flex-col gap-8 divide-y-0 items-center' }">
        <slot />

        <template #content>
            <span class="font-[Special_Gothic_Expanded_One] text-3xl leading-none text-nowrap">
                stacks
            </span>

            <div class="flex flex-wrap items-center justify-center gap-8">
                <NuxtImg
                    v-for="logo in logos"
                    :key="logo"
                    :src="`https://svgl.app/library/${logo}.svg`"
                    class="size-9"
                />
            </div>

            <span class="text-muted text-sm">with ❤️</span>
        </template>
    </UModal>
</template>
