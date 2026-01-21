<script setup lang="ts">
import type z from 'zod'

const open = defineModel<boolean>('open', {
    default: false,
})

interface Props {
    data?: Serialized<Art>
    fields?: {
        slug?: boolean
    }
}
const props = withDefaults(defineProps<Props>(), {
    data: undefined,
    fields: () => ({ slug: true }),
})

const emit = defineEmits(['success'])

const { saveArt, submitting } = useArt()

const schema = artsInsertSchema.omit({ images: true })
type Schema = z.infer<typeof schema>

const state = reactive<Schema>({
    slug: props.data?.slug || undefined,
    title: props.data?.title || '',
    description: props.data?.description || '',
    href: props.data?.href || '',
})
const images = ref<File[]>([])

const onSubmit = async () => {
    try {
        await saveArt(state, images.value)

        images.value = []
        state.href = ''
        state.slug = undefined
        state.title = ''
        state.description = ''

        open.value = false
        emit('success')
    } catch {
        // Error handling is done in useArt (logging/toast), but we keep modal open
    }
}
</script>

<template>
    <UModal
        v-model:open="open"
        :title="props.data?.slug ? 'Edit Art' : 'New Art'"
        :description="props.data?.slug ? `Editing #${props.data.slug}` : 'Add a new art'"
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
                <UFormField label="Images" name="images" required>
                    <UFileUpload v-model="images" multiple accept="image/*" class="min-h-32" />
                </UFormField>

                <UFormField label="Title" name="title" required>
                    <UInput
                        v-model="state.title"
                        placeholder="Art Title"
                        variant="soft"
                        size="xl"
                        class="w-full"
                    />
                </UFormField>

                <UFormField label="Description" name="description">
                    <UTextarea
                        v-model="state.description"
                        placeholder="Art Description"
                        variant="soft"
                        autoresize
                        :rows="3"
                        class="w-full"
                    />
                </UFormField>

                <UFormField v-if="props.fields?.slug" label="Slug" name="slug">
                    <UInput
                        v-model="state.slug"
                        placeholder="art-slug"
                        variant="soft"
                        class="w-full"
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
