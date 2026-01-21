<script setup lang="ts">
import type z from 'zod'

const open = defineModel<boolean>('open', {
    default: false,
})

interface Props {
    data?: Serialized<Work>
    categories?: string[]
    fields?: {
        slug?: boolean
    }
}
const props = withDefaults(defineProps<Props>(), {
    data: undefined,
    categories: () => [],
    fields: () => ({ slug: false }),
})

const emit = defineEmits(['success'])

const { saveWork, submitting } = useWork()

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

const onSubmit = async () => {
    try {
        await saveWork(state, imageFile.value)

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
    } catch {
        // Error handling in composable
    }
}
</script>

<template>
    <UModal
        v-model:open="open"
        :title="props.data?.slug ? 'Edit Work' : 'New Work'"
        :description="props.data?.slug ? `Editing #${props.data.slug}` : 'Add a new work'"
    >
        <slot />

        <template v-if="submitting.state" #content>
            <div class="grid gap-4 p-8">
                <span class="text-3xl leading-none font-extralight"
                    >{{ submitting.progress }}%</span
                >
                <UProgress v-model="submitting.progress" color="neutral" />
                <ConsoleLog :logs="submitting.logs" class="h-48" />
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

                <UFormField
                    label="Category"
                    name="category"
                    :ui="{ container: 'flex flex-col gap-2' }"
                >
                    <UInput
                        v-model="state.category"
                        placeholder="Web Application"
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
