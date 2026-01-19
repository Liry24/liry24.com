<script setup lang="ts">
const open = defineModel<boolean>('open', {
    default: false,
})

interface Props {
    data?: Serialized<Social>
}
const props = defineProps<Props>()

const emit = defineEmits(['success'])

const toast = useToast()

const state = reactive({
    href: props.data?.href || '',
    alias: props.data?.alias || '',
    label: props.data?.label || '',
    icon: props.data?.icon || '',
})

const submitting = ref(false)

const onSubmit = async () => {
    submitting.value = true

    try {
        if (props.data?.id)
            await $fetch('/api/admin/socials', {
                method: 'PATCH',
                body: {
                    id: props.data.id,
                    ...state,
                },
            })
        else
            await $fetch('/api/admin/socials', {
                method: 'POST',
                body: state,
            })

        toast.add({
            icon: 'mingcute:check-line',
            title: 'Success',
            description: 'Link saved successfully',
            color: 'success',
        })

        state.href = ''
        state.alias = ''
        state.label = ''
        state.icon = ''

        open.value = false
        emit('success')
    } catch (e) {
        console.log(e)
        toast.add({
            icon: 'mingcute:close-line',
            title: 'Error',
            description: 'An error occurred while saving the link',
            color: 'error',
        })
    } finally {
        submitting.value = false
    }
}
</script>

<template>
    <UModal v-model:open="open" :dismissible="false" title="New Link" description="Add a new link">
        <slot />

        <template #body>
            <UForm :state loading-auto class="grid gap-4" @submit="onSubmit">
                <div v-if="props.data?.id" class="flex items-center gap-2">
                    <span class="text-muted text-sm">Editing Link ID:</span>
                    <UBadge color="neutral">{{ props.data.id }}</UBadge>
                </div>

                <UFormField label="URL" name="href" required>
                    <UInput
                        v-model="state.href"
                        placeholder="https://example.com"
                        variant="soft"
                        class="w-full"
                    />
                </UFormField>

                <UFormField label="Alias" name="alias">
                    <UInput
                        v-model="state.alias"
                        placeholder="example"
                        variant="soft"
                        class="w-full"
                    />
                </UFormField>

                <UFormField label="Label" name="label" required>
                    <UInput
                        v-model="state.label"
                        placeholder="Label"
                        variant="soft"
                        class="w-full"
                    />
                </UFormField>

                <UFormField
                    label="Icon"
                    name="icon"
                    required
                    :ui="{ container: 'flex items-center gap-1' }"
                >
                    <UInput
                        v-model="state.icon"
                        placeholder="mingcute:link-line"
                        variant="soft"
                        class="w-full"
                    >
                        <template #trailing>
                            <Icon v-if="state.icon" :name="state.icon" class="size-5" />
                        </template>
                    </UInput>

                    <UPopover modal :ui="{ content: 'p-4 rounded-2xl' }">
                        <UButton
                            aria-label="Pick Icon"
                            icon="mingcute:color-picker-fill"
                            variant="soft"
                            color="neutral"
                        />

                        <template #content>
                            <IconPicker @select="state.icon = $event" />
                        </template>
                    </UPopover>
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
