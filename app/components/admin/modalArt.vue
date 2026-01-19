<script setup lang="ts">
import { upload } from '@vercel/blob/client'
import { nanoid } from 'nanoid'
import type z from 'zod'

const open = defineModel<boolean>('open', {
    default: false,
})

interface Props {
    data?: Serialized<Art>
    fields?: {
        slug?: boolean
    }
}
const props = withDefaults(defineProps<Props>(), {
    data: undefined,
    fields: () => ({ slug: true }),
})

const emit = defineEmits(['success'])

const toast = useToast()

const schema = artsInsertSchema.omit({ images: true })
type Schema = z.infer<typeof schema>

const state = reactive<Schema>({
    slug: props.data?.slug || undefined,
    title: props.data?.title || '',
    description: props.data?.description || '',
    href: props.data?.href || '',
})
const images = ref<File[]>([])
const submitting = ref(false)
const submittingProgress = ref(0)
const submittingLogs = ref<ConsoleLog[]>([])

const onSubmit = async () => {
    submitting.value = true
    submittingProgress.value = 0
    submittingLogs.value = []

    const addLog = (message: string, type: ConsoleLog['type'] = 'log') => {
        submittingLogs.value.push({
            createdAt: new Date(),
            message,
            type,
        })
    }

    try {
        const imageData: { src: string; alt?: string }[] = []

        if (images.value.length) {
            addLog(`Starting upload of ${images.value.length} images...`)

            const artSlug = state.slug?.toLowerCase().trim().replaceAll(' ', '-') || nanoid(4)
            for (let i = 0; i < images.value.length; i++) {
                const image = images.value[i]
                if (!image) continue

                addLog(`Uploading [${i + 1}/${images.value.length}] ${image.name}...`)

                const imageExt = image.name.split('.').pop()
                const imageName = `art-${artSlug}-${nanoid(6)}.${imageExt}`
                const blob = await upload(imageName, image, {
                    access: 'public',
                    handleUploadUrl: '/api/admin/upload',
                    onUploadProgress: (progress) => {
                        const currentFileProgress = progress.percentage / 100
                        const totalSteps = images.value.length + 1
                        const globalProgress = Math.floor(
                            ((i + currentFileProgress) / totalSteps) * 100
                        )
                        submittingProgress.value = globalProgress
                    },
                })

                imageData.push({ src: blob.url, alt: undefined })
                addLog(`Uploaded ${image.name} successfully.`)
            }
        }

        submittingProgress.value = 90
        addLog('Saving metadata to database...')

        await $fetch('/api/admin/arts', {
            method: props.data?.slug ? 'PATCH' : 'POST',
            body: props.data?.slug
                ? {
                      slug: props.data.slug,
                      images: imageData,
                      title: state.title,
                      description: state.description,
                      href: state.href,
                  }
                : {
                      ...state,
                      images: imageData,
                  },
        })

        submittingProgress.value = 100
        addLog('Art saved successfully.')

        toast.add({
            icon: 'mingcute:check-line',
            title: 'Success',
            description: 'Art saved successfully',
            color: 'success',
        })

        images.value = []
        state.href = ''
        state.slug = ''
        state.title = ''
        state.description = ''

        open.value = false
        emit('success')
    } catch (e) {
        console.error(e)
        addLog(`Error: ${e instanceof Error ? e.message : String(e)}`, 'error')
        toast.add({
            icon: 'mingcute:close-line',
            title: 'Error',
            description: 'Art saved failed',
            color: 'error',
        })
    } finally {
        submitting.value = false
    }
}
</script>

<template>
    <UModal v-model:open="open" :dismissible="false" title="New Art" description="Add a new art">
        <slot />

        <template v-if="submitting" #content>
            <div class="grid gap-4 p-8">
                <span class="text-3xl leading-none font-extralight">{{ submittingProgress }}%</span>
                <UProgress v-model="submittingProgress" color="neutral" />
                <ConsoleLog :logs="submittingLogs" class="h-48" />
            </div>
        </template>

        <template #body>
            <UForm :state :schema class="grid gap-4" @submit="onSubmit">
                <UFormField label="Images" name="images" required>
                    <UFileUpload v-model="images" multiple accept="image/*" class="min-h-32" />
                </UFormField>

                <UFormField label="Title" name="title" required>
                    <UInput
                        v-model="state.title"
                        placeholder="Art Title"
                        variant="soft"
                        size="xl"
                        class="w-full"
                    />
                </UFormField>

                <UFormField label="Description" name="description">
                    <UTextarea
                        v-model="state.description"
                        placeholder="Art Description"
                        variant="soft"
                        autoresize
                        :rows="3"
                        class="w-full"
                    />
                </UFormField>

                <UFormField v-if="props.fields?.slug" label="Slug" name="slug">
                    <UInput
                        v-model="state.slug"
                        placeholder="art-slug"
                        variant="soft"
                        class="w-full"
                    />
                </UFormField>

                <UFormField label="URL" name="href">
                    <UInput
                        v-model="state.href"
                        placeholder="https://example.com"
                        variant="soft"
                        class="w-full"
                    />
                </UFormField>

                <USeparator />

                <UButton
                    type="submit"
                    :label="props.data?.slug ? 'Update' : 'Add'"
                    color="neutral"
                    size="lg"
                    block
                />
            </UForm>
        </template>
    </UModal>
</template>
