export const useSocial = () => {
    const toast = useToast()

    const socials = useState<Serialized<Social>[]>('socials', () => [])
    const originalSocials = useState<Serialized<Social>[]>('socials-original', () => [])

    const submitting = ref<{
        state: boolean
        progress: number
        logs: ConsoleLog[]
    }>({
        state: false,
        progress: 0,
        logs: [],
    })

    const fetchSocials = async () => {
        const { data } = await useFetch('/api/socials', {
            key: 'socials-list',
            default: () => [],
        })

        if (data.value) {
            socials.value = [...data.value]
            originalSocials.value = [...data.value]
        }
    }

    const saveSocial = async (state: Partial<Social>) => {
        submitting.value.state = true
        submitting.value.progress = 0
        submitting.value.logs = []

        try {
            if (state.id)
                await $fetch('/api/admin/socials', {
                    method: 'PATCH',
                    body: state,
                })
            else
                await $fetch('/api/admin/socials', {
                    method: 'POST',
                    body: state,
                })

            submitting.value.progress = 100

            toast.add({
                icon: 'mingcute:check-line',
                title: 'Success',
                description: 'Link saved successfully',
                color: 'success',
            })

            await fetchSocials()
        } catch (e) {
            console.error(e)
            toast.add({
                icon: 'mingcute:close-line',
                title: 'Error',
                description: 'An error occurred while saving the link',
                color: 'error',
            })
            throw e
        } finally {
            submitting.value.state = false
        }
    }

    const deleteSocial = async (item: Serialized<Social>) => {
        const index = socials.value.findIndex((s) => s.id === item.id)
        if (index > -1) {
            socials.value.splice(index, 1)
        }
    }

    const reorderSocials = async () => {
        try {
            await $fetch('/api/admin/socials', {
                method: 'PUT',
                body: {
                    links: socials.value,
                },
            })

            await fetchSocials()

            toast.add({
                icon: 'mingcute:check-line',
                title: 'Saved',
                description: 'Your changes have been saved',
                color: 'success',
            })
        } catch {
            toast.add({
                icon: 'mingcute:close-line',
                title: 'Error',
                description: 'Failed to save changes',
                color: 'error',
            })
        }
    }

    return {
        socials,
        originalSocials,
        fetchSocials,
        saveSocial,
        deleteSocial,
        reorderSocials,
        submitting,
    }
}
