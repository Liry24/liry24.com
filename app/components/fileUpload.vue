<script setup lang="ts" generic="M extends boolean = false">
import type { FileUploadProps } from '@nuxt/ui'
import type { SignedUpload } from 'files-sdk'
import { nanoid } from 'nanoid'
import { joinURL, parseURL } from 'ufo'

interface Props extends FileUploadProps<M> {
    prefix?: string
}
const props = withDefaults(defineProps<Props>(), {
    interactive: true,
    prefix: undefined,
})

interface Image {
    src: string
    alt?: string | null
}

// Simplified model type
const model = defineModel<M extends true ? Image[] : Image | null>()

const files = shallowRef<(M extends true ? File[] : File) | null | undefined>()

const uploading = ref<{
    state: boolean
    progress: number
    logs: ConsoleLog[]
}>({
    state: false,
    progress: 0,
    logs: [],
})

const addLog = (message: string, type: ConsoleLog['type'] = 'log') => {
    uploading.value.logs.push({
        createdAt: new Date(),
        message,
        type,
    })
}

const createCleanURL = (url: string) => {
    const parsed = parseURL(url)
    return `${parsed.protocol || ''}//${joinURL(parsed.host || '', parsed.pathname)}`
}

const uploadWithProgress = (uploadInfo: SignedUpload, file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable)
                uploading.value.progress = Math.round((event.loaded / event.total) * 100)
        })

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                uploading.value.progress = 100
                resolve()
            } else {
                reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`))
            }
        })

        xhr.addEventListener('error', () => reject(new Error('Upload network error')))
        xhr.addEventListener('abort', () => reject(new Error('Upload aborted')))

        if (uploadInfo.method === 'POST') {
            const formData = new FormData()
            for (const [k, v] of Object.entries(uploadInfo.fields)) formData.append(k, v)

            formData.append('file', file)
            xhr.open('POST', uploadInfo.url)
            xhr.send(formData)
        } else {
            xhr.open('PUT', uploadInfo.url)
            if (uploadInfo.headers) {
                for (const [k, v] of Object.entries(uploadInfo.headers)) {
                    xhr.setRequestHeader(k, v)
                }
            }
            xhr.setRequestHeader('Content-Type', file.type)
            xhr.send(file)
        }
    })
}

const handleUpload = async (file: File, options: { name: string }) => {
    try {
        uploading.value.progress = 0
        const { uploadInfo, publicUrl } = await $fetch<{
            uploadInfo: SignedUpload
            publicUrl: string
            key: string
        }>('/api/admin/upload', {
            method: 'POST',
            body: { key: options.name, contentType: file.type },
        })

        await uploadWithProgress(uploadInfo, file)

        return { data: { url: publicUrl }, error: null }
    } catch (err) {
        return { data: null, error: err instanceof Error ? err : new Error(String(err)) }
    }
}

watch(files, async (value) => {
    // Prevent infinite loop by checking if value is empty/null
    if (!value || (Array.isArray(value) && value.length === 0)) return

    uploading.value.state = true

    try {
        if (Array.isArray(value)) {
            // Initialize model.value as array if not already
            if (!Array.isArray(model.value))
                model.value = [] as unknown as M extends true ? Image[] : Image | null

            for (const uploadItem of value) {
                addLog(`Uploading ${uploadItem.name}...`)
                const ext = uploadItem.name.split('.').pop()
                const name = `${props.prefix || ''}/${nanoid()}.${ext}`
                const result = await handleUpload(uploadItem, { name })
                if (result.error || !result.data) {
                    addLog(result.error?.message || 'Failed to upload', 'error')
                    throw result.error
                }
                ;(model.value as Image[]).push({
                    src: createCleanURL(result.data.url),
                    alt: undefined,
                })
                addLog('Uploaded successfully.')
            }
        } else {
            addLog(`Uploading ${value.name}...`)
            const ext = value.name.split('.').pop()
            const name = `${props.prefix || ''}/${nanoid(6)}.${ext}`
            const result = await handleUpload(value, { name })
            if (result.error || !result.data) {
                addLog(result.error?.message || 'Failed to upload', 'error')
                throw result.error
            }
            const newUrl = createCleanURL(result.data.url)
            await nextTick()
            model.value = {
                src: newUrl,
                alt: undefined,
            } as M extends true ? Image[] : Image | null
            addLog('Uploaded successfully.')
        }

        // Reset files after upload completes
        await nextTick()
        files.value = (Array.isArray(value) ? [] : null) as
            | (M extends true ? File[] : File)
            | null
            | undefined
    } catch (error) {
        console.error(error)
    } finally {
        uploading.value.state = false
    }
})

const isImage = (url: string) => {
    const cleanURL = createCleanURL(url)
    return (
        cleanURL.endsWith('.png') ||
        cleanURL.endsWith('.jpg') ||
        cleanURL.endsWith('.jpeg') ||
        cleanURL.endsWith('.gif') ||
        cleanURL.endsWith('.webp') ||
        cleanURL.endsWith('.svg') ||
        cleanURL.endsWith('.avif')
    )
}

// Reactive computed for uploaded files with image detection
const uploadedFiles = computed(() => {
    if (!model.value) return []
    const items = Array.isArray(model.value) ? model.value : [model.value]
    return items.map((item) => ({
        url: item.src,
        isImage: isImage(item.src),
    }))
})
</script>

<template>
    <div class="flex w-full flex-col gap-2">
        <UFileUpload v-model="files" v-bind="props">
            <template v-if="uploading.state" #default>
                <div
                    class="bg-default border-default flex w-full flex-1 flex-col items-stretch justify-center gap-2 rounded-lg border p-4 text-sm transition-[background]"
                >
                    <span>Uploading...</span>
                    <UProgress :value="uploading.progress" />
                    <ConsoleLog :logs="uploading.logs" class="h-32" />
                </div>
            </template>
        </UFileUpload>

        <div
            v-if="model && (Array.isArray(model) ? model.length > 0 : true)"
            class="flex w-full flex-col gap-2"
        >
            <div
                v-for="(uploaded, index) in uploadedFiles"
                :key="`uploaded-${index}`"
                class="flex items-center gap-2"
            >
                <NuxtImg
                    v-if="uploaded.isImage"
                    :src="uploaded.url"
                    alt=""
                    class="size-10 rounded-md object-cover"
                />
                <div
                    v-else
                    class="bg-muted flex size-10 shrink-0 items-center justify-center rounded-md"
                >
                    <Icon name="mingcute:file-fill" size="20" />
                </div>

                <span class="text-toned text-sm">{{ uploaded.url }}</span>
                <UButton
                    icon="mingcute:close-line"
                    variant="ghost"
                    color="neutral"
                    size="sm"
                    @click="
                        Array.isArray(model)
                            ? (model as Image[]).splice(index, 1)
                            : (model = null as unknown as M extends true ? Image[] : Image | null)
                    "
                />
            </div>
        </div>
    </div>
</template>
