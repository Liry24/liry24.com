import { upload } from '@tigrisdata/storage/client'
import { nanoid } from 'nanoid'

export const useArt = () => {
    const toast = useToast()

    const arts = useState<Serialized<Art>[]>('arts', () => [])
    const originalArts = useState<Serialized<Art>[]>('arts-original', () => [])

    const submitting = ref<{
        state: boolean
        progress: number
        logs: ConsoleLog[]
    }>({
        state: false,
        progress: 0,
        logs: [],
    })

    const fetchArts = async () => {
        const { data } = await useFetch('/api/arts', {
            key: 'arts-list',
            default: () => [],
            getCachedData: (key, n, ctx) =>
                ctx.cause !== 'refresh:manual' && n.isHydrating
                    ? n.payload.data[key]
                    : n.static.data[key],
        })

        if (data.value) {
            arts.value = [...data.value]
            originalArts.value = [...data.value]
        }
    }

    const addLog = (message: string, type: ConsoleLog['type'] = 'log') => {
        submitting.value.logs.push({
            createdAt: new Date(),
            message,
            type,
        })
    }

    const saveArt = async (
        state: {
            slug?: string | null
            title: string
            description?: string | null
            href?: string | null
        },
        images: File[]
    ) => {
        submitting.value.state = true
        submitting.value.progress = 0
        submitting.value.logs = []

        try {
            const imageData: { src: string; alt?: string }[] = []

            if (images.length) {
                addLog(`Starting upload of ${images.length} images...`)

                const artSlug = state.slug?.toLowerCase().trim().replaceAll(' ', '-') || nanoid(4)
                for (let i = 0; i < images.length; i++) {
                    const image = images[i]
                    if (!image) continue

                    addLog(`Uploading [${i + 1}/${images.length}] ${image.name}...`)

                    const imageExt = image.name.split('.').pop()
                    const imageName = `art-${artSlug}-${nanoid(6)}.${imageExt}`
                    const result = await upload(imageName, image, {
                        access: 'public',
                        url: '/api/admin/upload',
                        onUploadProgress: (progress) => {
                            const currentFileProgress = progress.percentage / 100
                            const totalSteps = images.length + 1
                            const globalProgress = Math.floor(
                                ((i + currentFileProgress) / totalSteps) * 100
                            )
                            submitting.value.progress = globalProgress
                        },
                    })
                    if (result.error) throw result.error
                    const blob = result.data

                    imageData.push({ src: blob.url, alt: undefined })
                    addLog(`Uploaded ${image.name} successfully.`)
                }
            }

            submitting.value.progress = 90
            addLog('Saving metadata to database...')

            await $fetch('/api/admin/arts', {
                method: state.slug ? 'PATCH' : 'POST',
                body: state.slug
                    ? {
                          slug: state.slug,
                          images: imageData,
                          title: state.title,
                          description: state.description || '',
                          href: state.href || '',
                      }
                    : {
                          ...state,
                          images: imageData,
                      },
            })

            submitting.value.progress = 100
            addLog('Art saved successfully.')

            toast.add({
                icon: 'mingcute:check-line',
                title: 'Success',
                description: 'Art saved successfully',
                color: 'success',
            })

            await fetchArts()
        } catch (e) {
            console.error(e)
            addLog(`Error: ${e instanceof Error ? e.message : String(e)}`, 'error')
            toast.add({
                icon: 'mingcute:close-line',
                title: 'Error',
                description: 'Art saved failed',
                color: 'error',
            })
            throw e
        } finally {
            submitting.value.state = false
        }
    }

    const deleteArt = async (item: Serialized<Art>) => {
        const index = arts.value.findIndex((a) => a.slug === item.slug)
        if (index > -1) {
            arts.value.splice(index, 1)
        }
    }

    const reorderArts = async () => {
        try {
            await $fetch('/api/admin/arts', {
                method: 'PUT',
                body: {
                    arts: arts.value,
                },
            })

            await fetchArts()

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
        arts,
        originalArts,
        fetchArts,
        saveArt,
        deleteArt,
        reorderArts,
        submitting,
    }
}
