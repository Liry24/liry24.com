<script setup lang="ts">
definePageMeta({
    layout: 'minimal',
})

const { signIn } = useAuth()
const route = useRoute()
const toast = useToast()
const callbackURL = computed(() => resolveLoginRedirect(route.query.redirect))

const signInWithPasskey = async () => {
    const result = await signIn.passkey()
    if (result.error) {
        toast.add({
            title: 'Passkeyでログインできませんでした',
            description: result.error.message,
            color: 'error',
        })
        return
    }

    await navigateTo(callbackURL.value, { external: true })
}

const signInWithGitHub = () => signIn.github(callbackURL.value)
const signInWithVercel = () => signIn.vercel(callbackURL.value)
</script>

<template>
    <div class="grid grow items-center">
        <UAuthForm
            title="Admin Console"
            :providers="[
                {
                    icon: 'mingcute:key-2-fill',
                    label: 'Passkey',
                    onClick: signInWithPasskey,
                },
                {
                    icon: 'mingcute:github-fill',
                    label: 'GitHub',
                    onClick: signInWithGitHub,
                },
                {
                    icon: 'mingcute:triangle-fill',
                    label: 'Vercel',
                    onClick: signInWithVercel,
                },
            ]"
            :ui="{ title: 'font-extralight text-4xl' }"
            class="mx-auto max-w-sm"
        />
    </div>
</template>
