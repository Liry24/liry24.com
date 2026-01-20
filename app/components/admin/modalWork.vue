<script setup lang="ts">
import { upload } from '@tigrisdata/storage/client'
import { nanoid } from 'nanoid'
import type z from 'zod'

const open = defineModel<boolean>('open', {
    default: false,
})

interface Props {
    data?: Work
    fields?: {
        slug?: boolean
    }
}
const props = withDefaults(defineProps<Props>(), {
    data: undefined,
    fields: () => ({ slug: false }),
})

const emit = defineEmits(['success'])

const toast = useToast()

const schema = worksInsertSchema
type Schema = z.infer<typeof schema>

const state = reactive<Schema>({
    slug: props.data?.slug || undefined,
    title: props.data?.title || '',
    description: props.data?.description || '',
    category: props.data?.category || '',
    image: props.data?.image || '',
    icon: props.data?.icon || '',
    href: props.data?.href || '',
})

const imageFile = ref<File | null>(null)
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
        if (imageFile.value) {
            addLog(`Uploading image: ${imageFile.value.name}...`)

            const imageExt = imageFile.value.name.split('.').pop()
            const imageName = `work-${state.slug?.toLowerCase().trim().replaceAll(' ', '-') || nanoid(6)}.${imageExt}`
            const result = await upload(imageName, imageFile.value, {
                access: 'public',
                url: '/api/admin/upload',
                onUploadProgress: (progress) => {
                    const currentFileProgress = progress.percentage / 100
                    const totalSteps = 2 // 1 for image, 1 for database
                    submittingProgress.value = Math.floor((currentFileProgress / totalSteps) * 100)
                },
            })
            if (result.error) throw result.error
            const blob = result.data

            state.image = blob.url
            addLog('Image uploaded successfully.')
        }

        submittingProgress.value = 50
        addLog(props.data?.slug ? 'Updating work metadata...' : 'Adding new work metadata...')

        await $fetch('/api/admin/works', {
            method: props.data?.slug ? 'PATCH' : 'POST',
            body: state,
        })

        submittingProgress.value = 100
        addLog('Work saved successfully.')

        toast.add({
            icon: 'mingcute:check-line',
            title: 'Success',
            description: 'Work saved successfully',
            color: 'success',
        })

        state.title = ''
        state.category = ''
        state.description = ''
        state.slug = ''
        state.image = ''
        state.icon = ''
        state.href = ''

        imageFile.value = null
        open.value = false
        emit('success')
    } catch (e) {
        console.error(e)
        addLog(`Error: ${e instanceof Error ? e.message : String(e)}`, 'error')
        toast.add({
            icon: 'mingcute:close-line',
            title: 'Error',
            description: 'An error occurred while saving the work',
            color: 'error',
        })
    } finally {
        submitting.value = false
    }
}
</script>

<template>
    <UModal v-model:open="open" :dismissible="false" title="New Work" description="Add a new work">
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
                <UFormField label="Title" name="title" required>
                    <UInput
                        v-model="state.title"
                        placeholder="Work Title"
                        variant="soft"
                        size="xl"
                        class="w-full"
                    />
                </UFormField>

                <UFormField label="Category" name="category">
                    <UInput
                        v-model="state.category"
                        placeholder="Web Application"
                        variant="soft"
                        class="w-full"
                    />
                </UFormField>

                <UFormField label="Description" name="description">
                    <UTextarea
                        v-model="state.description"
                        placeholder="Work Description"
                        variant="soft"
                        autoresize
                        :rows="3"
                        class="w-full"
                    />
                </UFormField>

                <UFormField v-if="props.fields.slug" label="Slug" name="slug">
                    <UInput
                        v-model="state.slug"
                        placeholder="work-slug"
                        variant="soft"
                        class="w-full"
                    />
                </UFormField>

                <UFormField label="Image">
                    <UFileUpload
                        v-model="imageFile"
                        accept="image/*"
                        layout="list"
                        position="inside"
                    />
                </UFormField>

                <div class="grid grid-cols-2 gap-4">
                    <UFormField label="Icon" name="icon">
                        <UInput
                            v-model="state.icon"
                            placeholder="lucide:globe"
                            variant="soft"
                            class="w-full"
                        >
                            <template #trailing>
                                <Icon v-if="state.icon" :name="state.icon" class="size-5" />
                            </template>
                        </UInput>
                    </UFormField>

                    <UFormField label="URL" name="href">
                        <UInput
                            v-model="state.href"
                            placeholder="https://example.com"
                            variant="soft"
                            class="w-full"
                        />
                    </UFormField>
                </div>

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
