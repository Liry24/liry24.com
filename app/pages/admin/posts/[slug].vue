<script setup lang="ts">
import type { Schema } from '~/components/admin/postForm.vue'

const route = useRoute()
const { updatePost, deletePost, publishPost, reviewPost, submitting } = usePost()

const { data, refresh } = await useFetch(`/api/admin/posts/${route.params.slug}`)

if (!data.value) navigateTo('/')

const toLocalDateTime = (value: string | Date | null | undefined) => {
    if (!value) return undefined
    const date = new Date(value)
    const offset = date.getTimezoneOffset() * 60_000
    return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

const state = reactive<Schema>({
    slug: data.value!.slug,
    title: data.value!.title,
    excerpt: data.value!.excerpt,
    tags: data.value!.tags.map((tag) => tag.tag),
    content: data.value!.content,
    status: data.value!.status === 'scheduled' ? 'scheduled' : 'draft',
    scheduledAt: toLocalDateTime(data.value!.scheduledAt),
})

const openModalDelete = ref(false)

const onSubmit = async () => {
    try {
        await updatePost(route.params.slug as string, state)
        await refresh()
    } catch {
        // Error handled in composable
    }
}

const onPublish = async () => {
    await publishPost(route.params.slug as string)
    await refresh()
}

const onReview = async () => {
    await reviewPost(route.params.slug as string)
    window.setTimeout(() => void refresh(), 2_000)
}

const onDelete = async () => {
    try {
        await deletePost(route.params.slug as string)
        openModalDelete.value = false
        navigateTo('/admin')
    } catch {
        // Error handled in composable
    }
}
</script>

<template>
    <div class="px-6">
        <UDashboardPanel resizable>
            <template #header>
                <UDashboardNavbar title="Edit Post" icon="mingcute:edit-3-fill">
                    <template #trailing>
                        <span class="text-muted ml-2 font-mono text-sm">{{ data?.slug }}</span>
                    </template>

                    <template #right>
                        <UModal
                            v-model:open="openModalDelete"
                            title="Are you sure you want to delete this post?"
                        >
                            <UButton
                                icon="mingcute:delete-2-fill"
                                label="Delete"
                                variant="outline"
                                color="neutral"
                                :ui="{ leadingIcon: 'size-4.5' }"
                            />

                            <template #body>
                                <UAlert
                                    icon="mingcute:delete-2-fill"
                                    title="This action cannot be undone."
                                    color="error"
                                    variant="outline"
                                />
                            </template>

                            <template #footer>
                                <UButton
                                    label="Delete"
                                    color="neutral"
                                    loading-auto
                                    class="ml-auto"
                                    @click="onDelete"
                                />
                            </template>
                        </UModal>

                        <UButton
                            icon="mingcute:ai-fill"
                            label="Review"
                            variant="outline"
                            color="neutral"
                            :loading="submitting"
                            @click="onReview"
                        />

                        <UButton
                            v-if="data?.status !== 'published'"
                            icon="mingcute:send-fill"
                            label="Publish"
                            variant="outline"
                            color="neutral"
                            :loading="submitting"
                            @click="onPublish"
                        />

                        <UButton
                            v-if="data?.status !== 'published'"
                            icon="mingcute:save-2-fill"
                            label="Save"
                            color="neutral"
                            loading-auto
                            @click="onSubmit"
                        />
                    </template>
                </UDashboardNavbar>
            </template>

            <template #body>
                <UScrollArea class="h-[calc(100dvh-var(--ui-header-height))] p-6">
                    <AdminPostForm
                        v-model="state"
                        :disabled="data?.status === 'published'"
                        :fields="{
                            slug: false,
                        }"
                        @submit="onSubmit"
                    />

                    <section v-if="data?.reviews?.length" class="mt-8 grid gap-3">
                        <h2 class="text-lg font-semibold">Editorial reviews</h2>
                        <UCard v-for="review in data.reviews" :key="review.id">
                            <div class="grid gap-3">
                                <div class="flex items-center justify-between gap-3">
                                    <UBadge
                                        :label="review.status"
                                        :color="review.status === 'completed' ? 'success' : 'error'"
                                        variant="soft"
                                    />
                                    <span class="text-muted text-xs">{{ review.model }}</span>
                                </div>
                                <ul v-if="review.issues.length" class="grid gap-2 text-sm">
                                    <li v-for="issue in review.issues" :key="issue.message">
                                        <strong class="capitalize">{{ issue.severity }}:</strong>
                                        {{ issue.message }}
                                    </li>
                                </ul>
                                <p v-else-if="review.error" class="text-error text-sm">
                                    {{ review.error }}
                                </p>
                                <UTextarea
                                    v-if="review.suggestedContent"
                                    :model-value="review.suggestedContent"
                                    readonly
                                    autoresize
                                />
                            </div>
                        </UCard>
                    </section>
                </UScrollArea>
            </template>
        </UDashboardPanel>
    </div>
</template>
