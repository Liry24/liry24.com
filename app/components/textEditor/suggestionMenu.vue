<script setup lang="ts">
import type { EditorSuggestionMenuItem } from '@nuxt/ui'
import type { Editor } from '@tiptap/vue-3'

interface Props {
    editor: Editor
}
const props = defineProps<Props>()

const suggestionItems = computed<EditorSuggestionMenuItem[][]>(() => [
    [
        {
            type: 'label',
            label: 'Text',
        },
        {
            kind: 'paragraph',
            label: 'Paragraph',
            icon: 'mingcute:text-line',
        },
        {
            kind: 'heading',
            level: 1,
            label: 'Heading 1',
            icon: 'mingcute:heading-1-line',
        },
        {
            kind: 'heading',
            level: 2,
            label: 'Heading 2',
            icon: 'mingcute:heading-2-line',
        },
        {
            kind: 'heading',
            level: 3,
            label: 'Heading 3',
            icon: 'mingcute:heading-3-line',
        },
    ],
    [
        {
            type: 'label',
            label: 'Lists',
        },
        {
            kind: 'bulletList',
            label: 'Bullet List',
            icon: 'mingcute:list-check-line',
        },
        {
            kind: 'orderedList',
            label: 'Numbered List',
            icon: 'mingcute:list-ordered-line',
        },
    ],
    [
        {
            type: 'label',
            label: 'Insert',
        },
        {
            kind: 'blockquote',
            label: 'Blockquote',
            icon: 'mingcute:quote-right-line',
        },
        {
            kind: 'codeBlock',
            label: 'Code Block',
            icon: 'mingcute:code-line',
        },
        {
            kind: 'horizontalRule',
            label: 'Divider',
            icon: 'mingcute:dividing-line-line',
        },
    ],
])

// eslint-disable-next-line no-constant-condition
const appendToBody = false ? () => document.body : undefined
</script>

<template>
    <UEditorSuggestionMenu
        :editor="props.editor"
        :items="suggestionItems"
        :append-to="appendToBody"
    />
</template>
