<script setup lang="ts">
import type { EditorToolbarItem } from '@nuxt/ui'
import type { Editor } from '@tiptap/vue-3'

interface Props {
    editor: Editor
}
const props = defineProps<Props>()

const bubbleToolbarItems = computed<EditorToolbarItem[][]>(() => [
    [
        {
            icon: 'mingcute:hashtag-line',
            tooltip: { text: 'Headings' },
            content: {
                align: 'start',
            },
            items: [
                {
                    kind: 'heading',
                    level: 1,
                    icon: 'mingcute:heading-1-line',
                    label: 'Heading 1',
                },
                {
                    kind: 'heading',
                    level: 2,
                    icon: 'mingcute:heading-2-line',
                    label: 'Heading 2',
                },
                {
                    kind: 'heading',
                    level: 3,
                    icon: 'mingcute:heading-3-line',
                    label: 'Heading 3',
                },
            ],
        },
    ],
    [
        {
            kind: 'mark',
            mark: 'bold',
            icon: 'mingcute:bold-line',
            tooltip: { text: 'Bold' },
        },
        {
            kind: 'mark',
            mark: 'italic',
            icon: 'mingcute:italic-line',
            tooltip: { text: 'Italic' },
        },
        {
            kind: 'mark',
            mark: 'underline',
            icon: 'mingcute:underline-line',
            tooltip: { text: 'Underline' },
        },
        {
            kind: 'mark',
            mark: 'strike',
            icon: 'mingcute:strikethrough-line',
            tooltip: { text: 'Strikethrough' },
        },
        {
            kind: 'mark',
            mark: 'code',
            icon: 'mingcute:code-line',
            tooltip: { text: 'Code' },
        },
    ],
])
</script>

<template>
    <UEditorToolbar :editor="props.editor" :items="bubbleToolbarItems" layout="bubble" />
</template>
