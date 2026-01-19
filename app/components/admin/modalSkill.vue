<script setup lang="ts">
const open = defineModel<boolean>('open', {
    default: false,
})

interface Props {
    data?: Serialized<Skill>
    categories?: string[]
}
const props = defineProps<Props>()

const emit = defineEmits(['success'])

const toast = useToast()

const state = reactive({
    name: props.data?.name || '',
    icon: props.data?.icon || '',
    category: props.data?.category || '',
})

const submitting = ref(false)

const onSubmit = async () => {
    submitting.value = true

    try {
        if (props.data?.id)
            await $fetch('/api/admin/skills', {
                method: 'PATCH',
                body: {
                    id: props.data.id,
                    ...state,
                },
            })
        else
            await $fetch('/api/admin/skills', {
                method: 'POST',
                body: state,
            })

        toast.add({
            icon: 'mingcute:check-line',
            title: 'Success',
            description: 'Skill saved successfully',
            color: 'success',
        })

        state.name = ''
        state.icon = ''
        state.category = ''

        open.value = false
        emit('success')
    } catch (e) {
        console.log(e)
        toast.add({
            icon: 'mingcute:close-line',
            title: 'Error',
            description: 'An error occurred while saving the skill',
            color: 'error',
        })
    } finally {
        submitting.value = false
    }
}
</script>

<template>
    <UModal v-model:open="open" title="New Skill" description="Add a new skill">
        <slot />

        <template #body>
            <UForm :state loading-auto class="grid gap-4" @submit="onSubmit">
                <div v-if="props.data?.id" class="flex items-center gap-2">
                    <span class="text-muted text-sm">Editing Skill ID:</span>
                    <UBadge color="neutral">{{ props.data.id }}</UBadge>
                </div>

                <UFormField label="Name" name="name" required>
                    <UInput
                        v-model="state.name"
                        placeholder="Skill Name"
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
                        placeholder="simple-icons:blender"
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

                <UFormField label="Category" name="category">
                    <UInput
                        v-model="state.category"
                        placeholder="Graphics"
                        variant="soft"
                        class="w-full"
                    />
                    <div class="flex flex-wrap gap-2">
                        <UButton
                            v-for="(category, index) in props.categories"
                            :key="`category-${index}`"
                            :label="category"
                            variant="outline"
                            color="neutral"
                            size="sm"
                        />
                    </div>
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
