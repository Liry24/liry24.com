<script setup lang="ts">
definePageMeta({
    layout: 'minimal',
})

const { signIn } = useAuth()
const route = useRoute()
const callbackURL = computed(() =>
    typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
        ? route.query.redirect
        : '/',
)
</script>

<template>
    <div class="grid grow items-center">
        <UAuthForm
            title="Admin Login"
            :providers="[
                {
                    icon: 'mingcute:key-2-fill',
                    label: 'Passkey',
                },
                {
                    icon: 'mingcute:github-fill',
                    label: 'GitHub',
                    onClick: () => {
                        signIn.github(callbackURL)
                    },
                },
                {
                    icon: 'mingcute:triangle-fill',
                    label: 'Vercel',
                    onClick: () => {
                        signIn.vercel(callbackURL)
                    },
                },
            ]"
            class="mx-auto max-w-sm"
        />
    </div>
</template>
