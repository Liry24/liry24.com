<script setup lang="ts">
definePageMeta({
    middleware: async () => {
        const { getSession } = useAuth()
        const session = await getSession()

        if (session.value) return navigateTo('/admin')
    },
    layout: 'minimal',
    pageTransition: false,
})

const { signIn } = useAuth()
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
                        signIn.github()
                    },
                },
                {
                    icon: 'mingcute:triangle-fill',
                    label: 'Vercel',
                    onClick: () => {
                        signIn.vercel()
                    },
                },
            ]"
            class="mx-auto max-w-sm"
        />
    </div>
</template>
