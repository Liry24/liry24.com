<script setup lang="ts">
import type { Schema } from '~/components/admin/postForm.vue'

const { savePost, submitting } = usePost()

const state = reactive<Schema>({
    slug: '',
    title: '',
    tags: [],
    content: '',
})

const onSubmit = async () => {
    try {
        const slug = await savePost(state)
        await navigateTo(`/admin/posts/${slug}`)
    } catch {
        // Error handled in composable
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
                            icon="mingcute:upload-fill"
                            label="Submit"
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
