import { upload } from '@tigrisdata/storage/client'
import { nanoid } from 'nanoid'

export const useWork = () => {
    const toast = useToast()

    const works = useState<Serialized<Work>[]>('works', () => [])
    const originalWorks = useState<Serialized<Work>[]>('works-original', () => [])

    const submitting = ref<{
        state: boolean
        progress: number
        logs: ConsoleLog[]
    }>({
        state: false,
        progress: 0,
        logs: [],
    })

    const fetchWorks = async () => {
        const { data } = await useFetch('/api/works', {
            key: 'works-list',
            default: () => [],
        })

        if (data.value) {
            works.value = [...data.value]
            originalWorks.value = [...data.value]
        }
    }

    const addLog = (message: string, type: ConsoleLog['type'] = 'log') => {
        submitting.value.logs.push({
            createdAt: new Date(),
            message,
            type,
        })
    }

    const saveWork = async (state: Partial<Work>, image: File | null) => {
        submitting.value.state = true
        submitting.value.progress = 0
        submitting.value.logs = []

        try {
            if (image) {
                addLog(`Uploading image: ${image.name}...`)
                const imageExt = image.name.split('.').pop()
                const workSlug = state.slug?.toLowerCase().trim().replaceAll(' ', '-') || nanoid(6)
                const imageName = `work-${workSlug}.${imageExt}`

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

                state.image = blob.url
                addLog('Image uploaded successfully.')
            }

            submitting.value.progress = 50
            addLog(state.slug ? 'Updating work metadata...' : 'Adding new work metadata...')

            await $fetch('/api/admin/works', {
                method: state.slug ? 'PATCH' : 'POST',
                body: state,
            })

            submitting.value.progress = 100
            addLog('Work saved successfully.')

            toast.add({
                icon: 'mingcute:check-line',
                title: 'Success',
                description: 'Work saved successfully',
                color: 'success',
            })

            await fetchWorks()
        } catch (e) {
            console.error(e)
            addLog(`Error: ${e instanceof Error ? e.message : String(e)}`, 'error')
            toast.add({
                icon: 'mingcute:close-line',
                title: 'Error',
                description: 'An error occurred while saving the work',
                color: 'error',
            })
            throw e
        } finally {
            submitting.value.state = false
        }
    }

    const deleteWork = async (item: Serialized<Work>) => {
        const index = works.value.findIndex((w) => w.slug === item.slug)
        if (index > -1) {
            works.value.splice(index, 1)
        }
    }

    const reorderWorks = async () => {
        try {
            await $fetch('/api/admin/works', {
                method: 'PUT',
                body: {
                    works: works.value,
                },
            })

            await fetchWorks()

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
        works,
        originalWorks,
        fetchWorks,
        saveWork,
        deleteWork,
        reorderWorks,
        submitting,
    }
}
