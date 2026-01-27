<script setup lang="ts">
import type z from 'zod'

const schema = postsInsertSchema
export type Schema = z.infer<typeof schema>

const model = defineModel<Schema>({
    required: true,
    default: {
        slug: '',
        title: '',
        tags: [],
        content: '',
    },
})

interface Props {
    fields?: {
        slug?: boolean
    }
}
const props = withDefaults(defineProps<Props>(), {
    fields: () => ({
        slug: true,
    }),
})

const emit = defineEmits(['submit'])
</script>

<template>
    <UForm
        :state="model"
        :schema
        loading-auto
        class="flex grow flex-col gap-6"
        @submit="emit('submit', model)"
    >
        <UFormField label="Title" name="title" required>
            <div class="border-muted border-b">
                <UInput v-model="model.title" variant="none" size="xl" class="w-full" />
            </div>
        </UFormField>

        <div class="grid grid-cols-2 gap-6">
            <UFormField v-if="props.fields.slug" label="Slug" name="slug">
                <UInput v-model="model.slug" variant="soft" class="w-full" />
            </UFormField>

            <UFormField label="Tags" name="tags" :class="cn(props.fields.slug ? '' : 'col-span-2')">
                <UInputTags v-model="model.tags" variant="soft" class="w-full" />
            </UFormField>
        </div>

        <UFormField
            label="Content"
            name="content"
            required
            :ui="{ container: 'grow flex flex-col' }"
            class="flex grow flex-col"
        >
            <template #hint>
                <span>0</span>
            </template>

            <TextEditor v-model="model.content" content-type="markdown" class="grow">
                <template #top="{ editor }">
                    <TextEditorFixedToolbar :editor />
                </template>
            </TextEditor>
        </UFormField>
    </UForm>
</template>
