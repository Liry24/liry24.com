import type { Schema } from '~/components/admin/postForm.vue'

export const usePost = () => {
    const toast = useToast()

    const submitting = ref<{
        state: boolean
        progress: number
        logs: ConsoleLog[]
    }>({
        state: false,
        progress: 0,
        logs: [],
    })

    const savePost = async (state: Schema) => {
        submitting.value.state = true
        submitting.value.progress = 0
        submitting.value.logs = []

        try {
            const { slug } = await $fetch('/api/admin/posts', {
                method: 'POST',
                body: state,
            })

            submitting.value.progress = 100

            toast.add({
                icon: 'mingcute:check-line',
                title: 'Saved',
                description: 'Your changes have been saved',
                color: 'success',
            })

            await refreshNuxtData('posts')
            return slug
        } catch (e) {
            console.error(e)
            toast.add({
                icon: 'mingcute:close-line',
                title: 'Error',
                description: 'Something went wrong while saving the post',
                color: 'error',
            })
            throw e
        } finally {
            submitting.value.state = false
        }
    }

    const updatePost = async (slug: string, state: Schema) => {
        submitting.value.state = true
        submitting.value.progress = 0
        submitting.value.logs = []

        try {
            await $fetch(`/api/admin/posts/${slug}`, {
                method: 'PUT',
                body: state,
            })

            submitting.value.progress = 100

            toast.add({
                icon: 'mingcute:check-line',
                title: 'Saved',
                description: 'Your changes have been saved',
                color: 'success',
            })

            await refreshNuxtData('posts')
        } catch (e) {
            console.error(e)
            toast.add({
                icon: 'mingcute:close-line',
                title: 'Error',
                description: 'Something went wrong while updating the post',
                color: 'error',
            })
            throw e
        } finally {
            submitting.value.state = false
        }
    }

    const deletePost = async (slug: string) => {
        submitting.value.state = true
        submitting.value.progress = 0
        submitting.value.logs = []

        try {
            await $fetch(`/api/admin/posts/${slug}`, {
                method: 'DELETE',
            })

            submitting.value.progress = 100

            await refreshNuxtData('posts')

            toast.add({
                icon: 'mingcute:check-line',
                title: 'Deleted',
                description: 'Your post has been deleted',
                color: 'success',
            })
        } catch (e) {
            console.error(e)
            toast.add({
                icon: 'mingcute:close-line',
                title: 'Error',
                description: 'Something went wrong while deleting the post',
                color: 'error',
            })
            throw e
        } finally {
            submitting.value.state = false
        }
    }

    return {
        savePost,
        updatePost,
        deletePost,
        submitting,
    }
}
