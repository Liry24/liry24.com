<script setup lang="ts">
import type { Schema } from '~/components/admin/postForm.vue'

const { savePost, submitting } = usePost()
const toast = useToast()
const generatingMetadata = ref(false)

const state = reactive<Schema>({
    slug: '',
    title: '',
    excerpt: '',
    tags: [],
    content: '',
    status: 'draft',
    scheduledAt: undefined,
})

const onSubmit = async () => {
    try {
        const slug = await savePost(state)
        await navigateTo(`/admin/posts/${slug}`)
    } catch {
        // Error handled in composable
    }
}

const generateMetadata = async () => {
    if (!state.content.trim()) {
        toast.add({ title: 'Content is required', description: 'Write the post body before generating metadata.', color: 'warning' })
        return
    }
    generatingMetadata.value = true
    try {
        const metadata = await $fetch('/api/admin/posts/metadata', {
            method: 'POST',
            body: { content: state.content },
        })
        state.slug = metadata.slug
        state.excerpt = metadata.excerpt
        toast.add({
            icon: 'mingcute:ai-fill',
            title: 'Metadata generated',
            description: 'Slug and OGP excerpt were filled from the current content.',
            color: 'success',
        })
    } catch (error) {
        console.error(error)
        toast.add({ title: 'Could not generate metadata', color: 'error' })
    } finally {
        generatingMetadata.value = false
    }
}
</script>

<template>
    <div class="px-6">
        <UDashboardPanel id="posts" resizable>
            <template #header>
                <UDashboardNavbar title="New Post" icon="mingcute:edit-3-fill">
                    <template #right>
                        <UButton
                            icon="mingcute:ai-fill"
                            label="Generate metadata"
                            variant="outline"
                            color="neutral"
                            :loading="generatingMetadata"
                            :disabled="!state.content.trim()"
                            @click="generateMetadata"
                        />
                        <UButton
                            icon="mingcute:upload-fill"
                            label="Save draft"
                            color="neutral"
                            :loading="submitting"
                            @click="onSubmit"
                        />
                    </template>
                </UDashboardNavbar>
            </template>

            <template #body>
                <UScrollArea class="h-[calc(100dvh-var(--ui-header-height))] p-6">
                    <AdminPostForm v-model="state" @submit="onSubmit" />
                </UScrollArea>
            </template>
        </UDashboardPanel>
    </div>
</template>
