<script setup lang="ts">
import { upload } from '@vercel/blob/client'

const open = defineModel<boolean>('open', {
    default: false,
})

interface Props {
    data?: Serialized<Rank>
}
const props = defineProps<Props>()

const emit = defineEmits(['success'])

const toast = useToast()

const image = ref<File | null>(null)

const state = reactive({
    href: props.data?.href || '',
    game: props.data?.game || '',
    season: props.data?.season || '',
    rank: props.data?.rank || '',
    imageUrl: props.data?.imageUrl || '',
})

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
        if (image.value) {
            addLog(`Uploading image: ${image.value.name}...`)
            const imageExt = image.value.name.split('.').pop()
            const imageName = `${state.game.toLowerCase().trim().replaceAll(' ', '-')}-${state.rank.toLowerCase().trim().replaceAll(' ', '-')}.${imageExt}`
            const blob = await upload(imageName, image.value, {
                access: 'public',
                handleUploadUrl: '/api/admin/upload',
                onUploadProgress: (progress) => {
                    const currentFileProgress = progress.percentage / 100
                    const totalSteps = 2 // 1 for image, 1 for database
                    submittingProgress.value = Math.floor((currentFileProgress / totalSteps) * 100)
                },
            })

            state.imageUrl = blob.url
            addLog('Image uploaded successfully.')
        }

        submittingProgress.value = 50
        addLog(props.data?.id ? 'Updating rank metadata...' : 'Adding new rank metadata...')

        await $fetch('/api/admin/ranks', {
            method: props.data?.id ? 'PATCH' : 'POST',
            body: props.data?.id
                ? {
                      id: props.data.id,
                      ...state,
                  }
                : state,
        })

        submittingProgress.value = 100
        addLog('Rank saved successfully.')

        toast.add({
            icon: 'mingcute:check-line',
            title: 'Success',
            description: 'Rank saved successfully',
            color: 'success',
        })

        image.value = null
        state.href = ''
        state.game = ''
        state.season = ''
        state.rank = ''
        state.imageUrl = ''

        open.value = false
        emit('success')
    } catch (e) {
        console.error(e)
        addLog(`Error: ${e instanceof Error ? e.message : String(e)}`, 'error')
        toast.add({
            icon: 'mingcute:close-line',
            title: 'Error',
            description: 'An error occurred while saving the rank',
            color: 'error',
        })
    } finally {
        submitting.value = false
    }
}
</script>

<template>
    <UModal v-model:open="open" :dismissible="false" title="New Rank" description="Add a new rank">
        <slot />

        <template v-if="submitting" #content>
            <div class="grid gap-4 p-8">
                <span class="text-3xl leading-none font-extralight">{{ submittingProgress }}%</span>
                <UProgress v-model="submittingProgress" color="neutral" />
                <ConsoleLog :logs="submittingLogs" class="h-48" />
            </div>
        </template>

        <template #body>
            <UForm :state="state" loading-auto class="grid gap-4" @submit="onSubmit">
                <div v-if="props.data?.id" class="flex items-center gap-2">
                    <span class="text-muted text-sm">Editing Rank ID:</span>
                    <UBadge color="neutral">{{ props.data.id }}</UBadge>
                </div>

                <UFormField label="Game" name="game" required>
                    <UInput
                        v-model="state.game"
                        placeholder="VALORANT"
                        variant="soft"
                        class="w-full"
                    />
                </UFormField>

                <UFormField label="Season" name="season">
                    <UInput
                        v-model="state.season"
                        placeholder="V26A1"
                        variant="soft"
                        class="w-full"
                    />
                </UFormField>

                <UFormField label="Rank" name="rank" required>
                    <UInput
                        v-model="state.rank"
                        placeholder="Immortal 1"
                        variant="soft"
                        class="w-full"
                    />
                </UFormField>

                <UFormField label="Image" required>
                    <UFileUpload v-model="image" accept="image/*" layout="list" position="inside" />
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
                    :label="props.data?.id ? 'Update' : 'Add'"
                    color="neutral"
                    size="lg"
                    block
                />
            </UForm>
        </template>
    </UModal>
</template>
