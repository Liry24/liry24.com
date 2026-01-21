export const useCareer = () => {
    const toast = useToast()

    const careers = useState<Serialized<Career>[]>('careers', () => [])
    const originalCareers = useState<Serialized<Career>[]>('careers-original', () => [])

    const submitting = ref<{
        state: boolean
        progress: number
        logs: ConsoleLog[]
    }>({
        state: false,
        progress: 0,
        logs: [],
    })

    const fetchCareers = async () => {
        const { data } = await useFetch('/api/careers', {
            key: 'careers-list',
            default: () => [],
        })

        if (data.value) {
            careers.value = [...data.value]
            originalCareers.value = [...data.value]
        }
    }

    const saveCareer = async (state: Partial<Career>) => {
        submitting.value.state = true
        submitting.value.progress = 0
        submitting.value.logs = []

        try {
            if (state.id)
                await $fetch('/api/admin/careers', {
                    method: 'PATCH',
                    body: state,
                })
            else
                await $fetch('/api/admin/careers', {
                    method: 'POST',
                    body: state,
                })

            submitting.value.progress = 100

            toast.add({
                icon: 'mingcute:check-line',
                title: 'Success',
                description: 'Career saved successfully',
                color: 'success',
            })

            await fetchCareers()
        } catch (e) {
            console.error(e)
            toast.add({
                icon: 'mingcute:close-line',
                title: 'Error',
                description: 'An error occurred while saving the career',
                color: 'error',
            })
            throw e
        } finally {
            submitting.value.state = false
        }
    }

    const deleteCareer = async (item: Serialized<Career>) => {
        const index = careers.value.findIndex((c) => c.id === item.id)
        if (index > -1) {
            careers.value.splice(index, 1)
        }
    }

    const reorderCareers = async () => {
        try {
            await $fetch('/api/admin/careers', {
                method: 'PUT',
                body: {
                    careers: careers.value,
                },
            })

            await fetchCareers()

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
        careers,
        originalCareers,
        fetchCareers,
        saveCareer,
        deleteCareer,
        reorderCareers,
        submitting,
    }
}
