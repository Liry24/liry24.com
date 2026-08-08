<script setup lang="ts">
definePageMeta({ layout: 'minimal', middleware: 'oauth-consent' })

const route = useRoute()
const { client: auth, session } = await useAuth()
const toast = useToast()
const clientId = typeof route.query.client_id === 'string' ? route.query.client_id : ''
const requestedScopes =
    typeof route.query.scope === 'string'
        ? route.query.scope.split(' ').filter(Boolean)
        : ['liry24:admin']
const { data } = await useFetch('/api/oauth-client', {
    query: { clientId },
})
const submitting = ref(false)

const scopeLabels: Record<string, string> = {
    'liry24:admin': 'Liry24の管理データを参照し、確認後に変更する',
    offline_access: 'クライアントを閉じた後も接続を維持する',
}

const decide = async (accept: boolean) => {
    submitting.value = true
    try {
        const result = await auth.oauth2.consent({ accept })
        if (result.error) throw new Error(result.error.message)
    } catch (error) {
        toast.add({
            title: '認可を完了できませんでした',
            description: error instanceof Error ? error.message : String(error),
            color: 'error',
        })
    } finally {
        submitting.value = false
    }
}
</script>

<template>
    <div class="mx-auto grid min-h-dvh w-full max-w-lg place-items-center px-6 py-10">
        <main class="border-default grid w-full gap-6 rounded-2xl border p-6 shadow-sm">
            <NuxtLink to="/" class="mx-auto text-3xl font-semibold">Liry24</NuxtLink>
            <div class="text-center">
                <h1 class="text-xl font-semibold">管理アクセスを許可</h1>
                <p class="text-muted mt-2 text-sm">
                    {{ data?.client.name || 'MCPクライアント' }} がアクセスを求めています。
                </p>
            </div>
            <div v-if="data?.client" class="bg-elevated flex items-center gap-3 rounded-lg p-4">
                <UAvatar icon="mingcute:plugin-2-line" :alt="data.client.name || 'OAuth client'" />
                <div class="min-w-0">
                    <p class="truncate font-medium">
                        {{ data.client.name || data.client.clientId }}
                    </p>
                    <a
                        v-if="data.client.uri"
                        :href="data.client.uri"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-muted block truncate text-xs underline"
                    >
                        {{ data.client.uri }}
                    </a>
                </div>
            </div>
            <section class="grid gap-3">
                <h2 class="text-sm font-medium">許可する操作</h2>
                <ul class="grid gap-2 text-sm">
                    <li v-for="scope in requestedScopes" :key="scope" class="flex gap-2">
                        <UIcon name="mingcute:check-circle-fill" class="mt-0.5 size-4 shrink-0" />
                        <span>{{ scopeLabels[scope] || scope }}</span>
                    </li>
                </ul>
            </section>
            <p class="text-muted text-xs leading-5">
                {{ session?.user.email }} の管理者権限として許可します。変更は実行前に差分確認を
                要求します。
            </p>
            <div class="grid grid-cols-2 gap-3">
                <UButton
                    label="拒否"
                    color="neutral"
                    variant="outline"
                    :loading="submitting"
                    @click="decide(false)"
                />
                <UButton label="許可" color="neutral" :loading="submitting" @click="decide(true)" />
            </div>
        </main>
    </div>
</template>
