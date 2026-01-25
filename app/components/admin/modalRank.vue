<script setup lang="ts">
const open = defineModel<boolean>('open', {
    default: false,
})

interface Props {
    data?: Serialized<Rank>
}
const props = defineProps<Props>()

const emit = defineEmits(['success'])

const { createRank, updateRank } = useRank()

const image = ref<File | null>(null)

const state = reactive({
    href: props.data?.href || '',
    game: props.data?.game || '',
    season: props.data?.season || '',
    rank: props.data?.rank || '',
    imageUrl: props.data?.imageUrl || '',
})

const onSubmit = async () => {
    try {
        if (props.data?.id) await updateRank(props.data.id, state)
        else await createRank(state)

        state.href = ''
        state.game = ''
        state.season = ''
        state.rank = ''
        state.imageUrl = ''

        open.value = false
        emit('success')
    } catch {
        // Error handling in composable
    }
}
</script>

<template>
    <UModal
        v-model:open="open"
        :title="props.data?.id ? 'Edit Rank' : 'New Rank'"
        :description="props.data?.id ? `Editing #${props.data.id}` : 'Add a new rank'"
    >
        <slot />

        <template #body>
            <UForm :state="state" loading-auto class="grid gap-4" @submit="onSubmit">
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
                    <FileUpload
                        v-model="state.imageUrl"
                        prefix="rank"
                        accept="image/*"
                        label="Upload Image"
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
            </UForm>
        </template>

        <template #footer>
            <UButton
                :label="props.data?.id ? 'Update' : 'Add'"
                color="neutral"
                size="lg"
                block
                loading-auto
                @click="onSubmit"
            />
        </template>
    </UModal>
</template>
