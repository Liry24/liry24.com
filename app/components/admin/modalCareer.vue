<script setup lang="ts">
const open = defineModel<boolean>('open', {
    default: false,
})

interface Props {
    data?: Serialized<Career>
}
const props = defineProps<Props>()

const emit = defineEmits(['success'])

const toast = useToast()

const state = reactive({
    period: props.data?.period || '',
    position: props.data?.position || '',
    company: props.data?.company || '',
})

const submitting = ref(false)

const onSubmit = async () => {
    submitting.value = true

    try {
        if (props.data?.id)
            await $fetch('/api/admin/careers', {
                method: 'PATCH',
                body: {
                    id: props.data.id,
                    ...state,
                },
            })
        else
            await $fetch('/api/admin/careers', {
                method: 'POST',
                body: state,
            })

        toast.add({
            icon: 'mingcute:check-line',
            title: 'Success',
            description: 'Career saved successfully',
            color: 'success',
        })

        state.period = ''
        state.position = ''
        state.company = ''

        open.value = false
        emit('success')
    } catch (e) {
        console.log(e)
        toast.add({
            icon: 'mingcute:close-line',
            title: 'Error',
            description: 'An error occurred while saving the career',
            color: 'error',
        })
    } finally {
        submitting.value = false
    }
}
</script>

<template>
    <UModal
        v-model:open="open"
        :dismissible="false"
        title="New Career"
        description="Add a new career"
    >
        <slot />

        <template #body>
            <UForm :state loading-auto class="grid gap-4" @submit="onSubmit">
                <div v-if="props.data?.id" class="flex items-center gap-2">
                    <span class="text-muted text-sm">Editing Career ID:</span>
                    <UBadge color="neutral">{{ props.data.id }}</UBadge>
                </div>

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
                    :loading="submitting"
                />
            </UForm>
        </template>
    </UModal>
</template>
