<script setup lang="ts">
import type { Schema } from '~/components/admin/postForm.vue'

const route = useRoute()
const { updatePost, deletePost } = usePost()

const { data, refresh } = await useFetch(`/api/posts/${route.params.slug}`)

if (!data.value) navigateTo('/admin')

const state = reactive<Schema>({
    slug: data.value!.slug,
    title: data.value!.title,
    tags: data.value!.tags.map((tag) => tag.tag),
    content: data.value!.content,
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
                    </template>
                </UDashboardNavbar>
            </template>

            <template #body>
                <UScrollArea class="h-[calc(100dvh-var(--ui-header-height))] p-6">
                    <AdminPostForm
                        v-model="state"
                        :fields="{
                            slug: false,
                        }"
                        @submit="onSubmit"
                    />
                </UScrollArea>
            </template>
        </UDashboardPanel>
    </div>
</template>
