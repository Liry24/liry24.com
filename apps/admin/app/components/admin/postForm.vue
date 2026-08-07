<script setup lang="ts">
import { z } from 'zod'

const schema = z
    .object({
        slug: z.string().optional(),
        title: z.string().min(1, 'Title is required'),
        excerpt: z.string().max(500).default(''),
        tags: z.string().min(1).array().default([]),
        content: z.string().min(1, 'Content is required'),
        status: z.enum(['draft', 'scheduled']).default('draft'),
        scheduledAt: z.string().optional(),
    })
    .superRefine((value, context) => {
        if (value.status !== 'scheduled') return
        const scheduledAt = value.scheduledAt ? new Date(value.scheduledAt) : null
        if (!scheduledAt || Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date())
            context.addIssue({
                code: 'custom',
                path: ['scheduledAt'],
                message: 'Choose a future publication time',
            })
    })
export type Schema = z.input<typeof schema>

const model = defineModel<Schema>({
    required: true,
})

interface Props {
    disabled?: boolean
    fields?: {
        slug?: boolean
    }
}
const props = withDefaults(defineProps<Props>(), {
    disabled: false,
    fields: () => ({
        slug: true,
    }),
})

const emit = defineEmits(['submit'])
const statusItems = [
    { label: 'Draft', value: 'draft' },
    { label: 'Scheduled', value: 'scheduled' },
]
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
                <UInput
                    v-model="model.title"
                    variant="none"
                    size="xl"
                    class="w-full"
                    :disabled="props.disabled"
                />
            </div>
        </UFormField>

        <div class="grid grid-cols-2 gap-6">
            <UFormField v-if="props.fields.slug" label="Slug" name="slug">
                <UInput
                    v-model="model.slug"
                    variant="soft"
                    class="w-full"
                    :disabled="props.disabled"
                />
            </UFormField>

            <UFormField label="Tags" name="tags" :class="cn(props.fields.slug ? '' : 'col-span-2')">
                <UInputTags
                    v-model="model.tags"
                    variant="soft"
                    class="w-full"
                    :disabled="props.disabled"
                />
            </UFormField>
        </div>

        <div class="grid grid-cols-2 gap-6">
            <UFormField label="Status" name="status">
                <USelect
                    v-model="model.status"
                    :items="statusItems"
                    class="w-full"
                    :disabled="props.disabled"
                />
            </UFormField>

            <UFormField v-if="model.status === 'scheduled'" label="Publish at" name="scheduledAt">
                <UInput
                    v-model="model.scheduledAt"
                    type="datetime-local"
                    class="w-full"
                    :disabled="props.disabled"
                />
            </UFormField>
        </div>

        <UFormField label="Excerpt" name="excerpt">
            <UTextarea
                v-model="model.excerpt"
                :rows="3"
                autoresize
                class="w-full"
                :disabled="props.disabled"
            />
        </UFormField>

        <UFormField
            label="Content"
            name="content"
            required
            :ui="{ container: 'grow flex flex-col' }"
            class="flex grow flex-col"
        >
            <UTextarea v-model="model.content" autoresize :rows="6" variant="soft" />
        </UFormField>
    </UForm>
</template>
