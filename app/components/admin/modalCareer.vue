<script setup lang="ts">
const open = defineModel<boolean>('open', {
    default: false,
})

interface Props {
    data?: Serialized<Career>
}
const props = defineProps<Props>()

const emit = defineEmits(['success'])

const { saveCareer, submitting } = useCareer()

const state = reactive({
    period: props.data?.period || '',
    position: props.data?.position || '',
    company: props.data?.company || '',
})

const onSubmit = async () => {
    try {
        await saveCareer({
            ...(props.data?.id ? { id: props.data.id } : {}),
            ...state,
        })

        state.period = ''
        state.position = ''
        state.company = ''

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
        :title="props.data?.id ? 'Edit Career' : 'New Career'"
        :description="props.data?.id ? `Editing #${props.data.id}` : 'Add a new career'"
    >
        <slot />

        <template #body>
            <UForm :state loading-auto class="grid gap-4" @submit="onSubmit">
                <UFormField label="Period" name="period" required>
                    <UInput
                        v-model="state.period"
                        placeholder="2021.4 - Now"
                        variant="soft"
                        class="w-full"
                    />
                </UFormField>

                <UFormField label="Position" name="position" required>
                    <UInput
                        v-model="state.position"
                        placeholder="3DCG Modeler"
                        variant="soft"
                        class="w-full"
                    />
                </UFormField>

                <UFormField label="Company" name="company" required>
                    <UInput
                        v-model="state.company"
                        placeholder="Game Dev Studio"
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
                    :loading="submitting.state"
                />
            </UForm>
        </template>
    </UModal>
</template>
