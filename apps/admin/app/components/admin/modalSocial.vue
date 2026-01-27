<script setup lang="ts">
const open = defineModel<boolean>('open', {
    default: false,
})

interface Props {
    data?: Serialized<Social>
}
const props = defineProps<Props>()

const emit = defineEmits(['success'])

const { createSocial, updateSocial } = useSocial()

const state = reactive({
    href: props.data?.href || '',
    alias: props.data?.alias || '',
    label: props.data?.label || '',
    icon: props.data?.icon || '',
})

const onSubmit = async () => {
    try {
        if (props.data?.id) await updateSocial(props.data.id, state)
        else await createSocial(state)

        state.alias = ''
        state.label = ''
        state.icon = ''
        state.href = ''

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
        :title="props.data?.id ? 'Edit Link' : 'New Link'"
        :description="props.data?.id ? `Editing #${props.data.id}` : 'Add a new link'"
    >
        <slot />

        <template #body>
            <UForm :state loading-auto class="grid gap-4" @submit="onSubmit">
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
