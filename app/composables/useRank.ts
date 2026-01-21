import { upload } from '@tigrisdata/storage/client'

export const useRank = () => {
    const toast = useToast()

    const ranks = useState<Serialized<Rank>[]>('ranks', () => [])
    const originalRanks = useState<Serialized<Rank>[]>('ranks-original', () => [])

    const submitting = ref<{
        state: boolean
        progress: number
        logs: ConsoleLog[]
    }>({
        state: false,
        progress: 0,
        logs: [],
    })

    const fetchRanks = async () => {
        const { data } = await useFetch('/api/ranks', {
            key: 'ranks-list',
            default: () => [],
        })

        if (data.value) {
            ranks.value = [...data.value]
            originalRanks.value = [...data.value]
        }
    }

    const addLog = (message: string, type: ConsoleLog['type'] = 'log') => {
        submitting.value.logs.push({
            createdAt: new Date(),
            message,
            type,
        })
    }

    const saveRank = async (state: Partial<Rank>, image: File | null) => {
        submitting.value.state = true
        submitting.value.progress = 0
        submitting.value.logs = []

        try {
            if (image) {
                addLog(`Uploading image: ${image.name}...`)
                const imageExt = image.name.split('.').pop()
                // Ensure game and rank string values exist for filename generation, fallback to defaults or existing data if state is partial?
                // The modal passed reactive state which should be complete enough.
                const gameName = state.game?.toLowerCase().trim().replaceAll(' ', '-') || 'game'
                const rankName = state.rank?.toLowerCase().trim().replaceAll(' ', '-') || 'rank'

                const imageName = `${gameName}-${rankName}.${imageExt}`

                const result = await upload(imageName, image, {
                    access: 'public',
                    url: '/api/admin/upload',
                    onUploadProgress: (progress) => {
                        const currentFileProgress = progress.percentage / 100
                        const totalSteps = 2
                        submitting.value.progress = Math.floor(
                            (currentFileProgress / totalSteps) * 100
                        )
                    },
                })
                if (result.error) throw result.error
                const blob = result.data

                state.imageUrl = blob.url
                addLog('Image uploaded successfully.')
            }

            submitting.value.progress = 50
            addLog(state.id ? 'Updating rank metadata...' : 'Adding new rank metadata...')

            await $fetch('/api/admin/ranks', {
                method: state.id ? 'PATCH' : 'POST',
                body: state.id
                    ? {
                          id: state.id,
                          ...state,
                      }
                    : state,
            })

            submitting.value.progress = 100
            addLog('Rank saved successfully.')

            toast.add({
                icon: 'mingcute:check-line',
                title: 'Success',
                description: 'Rank saved successfully',
                color: 'success',
            })

            await fetchRanks()
        } catch (e) {
            console.error(e)
            addLog(`Error: ${e instanceof Error ? e.message : String(e)}`, 'error')
            toast.add({
                icon: 'mingcute:close-line',
                title: 'Error',
                description: 'An error occurred while saving the rank',
                color: 'error',
            })
            throw e
        } finally {
            submitting.value.state = false
        }
    }

    const deleteRank = async (item: Serialized<Rank>) => {
        const index = ranks.value.findIndex((r) => r.id === item.id)
        if (index > -1) {
            ranks.value.splice(index, 1)
        }
    }

    const reorderRanks = async () => {
        try {
            await $fetch('/api/admin/ranks', {
                method: 'PUT',
                body: {
                    ranks: ranks.value,
                },
            })

            await fetchRanks()

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
        ranks,
        originalRanks,
        fetchRanks,
        saveRank,
        deleteRank,
        reorderRanks,
        submitting,
    }
}
