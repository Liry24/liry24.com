<script setup lang="ts">
import type { Schema } from '~/components/admin/postForm.vue'

definePageMeta({
    middleware: 'admin',
    layout: 'admin',
    pageTransition: false,
})

const toast = useToast()

const state = reactive<Schema>({
    slug: '',
    title: '',
    tags: [],
    content: '',
})

const submitting = ref(false)

const onSubmit = async () => {
    submitting.value = true
    try {
        const { slug } = await $fetch('/api/admin/posts', {
            method: 'POST',
            body: state,
        })

        toast.add({
            icon: 'mingcute:check-line',
            title: 'Saved',
            description: 'Your changes have been saved',
            color: 'success',
        })

        await refreshNuxtData('posts')
        await navigateTo(`/admin/posts/${slug}`)
    } catch (e) {
        console.log(e)
        toast.add({
            icon: 'mingcute:close-line',
            title: 'Error',
            description: 'Something went wrong',
            color: 'error',
        })
    } finally {
        submitting.value = false
    }
}
</script>

<template>
    <div class="px-6">
        <UDashboardPanel id="posts" resizable>
            <template #header>
                <UDashboardNavbar title="New Blog" icon="mingcute:edit-3-fill">
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
