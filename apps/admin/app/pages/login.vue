<script setup lang="ts">
definePageMeta({
    layout: 'minimal',
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
