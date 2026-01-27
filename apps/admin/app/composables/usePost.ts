import type { Schema } from '~/components/admin/postForm.vue'

export const usePost = () => {
    const toast = useToast()

    const submitting = ref(false)

    const savePost = async (state: Schema) => {
        submitting.value = true

        try {
            const { slug } = await $fetch('/api/posts', {
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
            submitting.value = false
        }
    }

    const updatePost = async (slug: string, state: Schema) => {
        submitting.value = true

        try {
            await $fetch(`/api/posts/${slug}`, {
                method: 'PUT',
                body: state,
            })

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
            submitting.value = false
        }
    }

    const deletePost = async (slug: string) => {
        submitting.value = true

        try {
            await $fetch(`/api/posts/${slug}`, {
                method: 'DELETE',
            })

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
            submitting.value = false
        }
    }

    return {
        savePost,
        updatePost,
        deletePost,
        submitting,
    }
}
