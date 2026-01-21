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

const { saveSkill, submitting } = useSkill()

const state = reactive({
    name: props.data?.name || '',
    icon: props.data?.icon || '',
    category: props.data?.category || '',
})

const onSubmit = async () => {
    try {
        await saveSkill({
            ...(props.data?.id ? { id: props.data.id } : {}),
            ...state,
        })

        state.name = ''
        state.icon = ''
        state.category = ''

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
        :title="props.data?.id ? 'Edit Skill' : 'New Skill'"
        :description="props.data?.id ? `Editing #${props.data.id}` : 'Add a new skill'"
    >
        <slot />

        <template #body>
            <UForm :state loading-auto class="grid gap-4" @submit="onSubmit">
                <UFormField label="Name" name="name" required>
                    <UInput
                        v-model="state.name"
                        placeholder="Skill Name"
                        variant="soft"
                        autofocus
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

                <UFormField
                    label="Category"
                    name="category"
                    :ui="{ container: 'flex flex-col gap-2' }"
                >
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
                            size="sm"
                            @click="state.category = category"
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
                    :loading="submitting.state"
                />
            </UForm>
        </template>
    </UModal>
</template>
