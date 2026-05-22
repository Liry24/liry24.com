<script setup lang="ts">
import type { EditorToolbarItem } from '@nuxt/ui'
import type { Editor } from '@tiptap/vue-3'
// import { useEditorCompletion } from './useComplesion'

interface Props {
    editor: Editor
}
const props = defineProps<Props>()

// const editorRef = useTemplateRef('editorRef')

// const { isLoading: aiLoading } = useEditorCompletion(editorRef)

const fixedToolbarItems = computed<EditorToolbarItem[][]>(() => [
    // [
    //     {
    //         icon: 'i-lucide-sparkles',
    //         label: 'Improve',
    //         variant: 'soft',
    //         // loading: aiLoading.value,
    //         content: {
    //             align: 'start',
    //         },
    //         items: [
    //             {
    //                 kind: 'aiFix',
    //                 icon: 'i-lucide-spell-check',
    //                 label: 'Fix spelling & grammar',
    //             },
    //             {
    //                 kind: 'aiExtend',
    //                 icon: 'i-lucide-unfold-vertical',
    //                 label: 'Extend text',
    //             },
    //             {
    //                 kind: 'aiReduce',
    //                 icon: 'i-lucide-fold-vertical',
    //                 label: 'Reduce text',
    //             },
    //             {
    //                 kind: 'aiSimplify',
    //                 icon: 'i-lucide-lightbulb',
    //                 label: 'Simplify text',
    //             },
    //             {
    //                 kind: 'aiContinue',
    //                 icon: 'i-lucide-text',
    //                 label: 'Continue sentence',
    //             },
    //             {
    //                 kind: 'aiSummarize',
    //                 icon: 'i-lucide-list',
    //                 label: 'Summarize',
    //             },
    //             {
    //                 icon: 'i-lucide-languages',
    //                 label: 'Translate',
    //                 children: [
    //                     {
    //                         kind: 'aiTranslate',
    //                         language: 'English',
    //                         label: 'English',
    //                     },
    //                     {
    //                         kind: 'aiTranslate',
    //                         language: 'Japanese',
    //                         label: 'Japanese',
    //                     },
    //                     {
    //                         kind: 'aiTranslate',
    //                         language: 'Korean',
    //                         label: 'Korean',
    //                     },
    //                 ],
    //             },
    //         ],
    //     },
    // ],
    [
        {
            kind: 'undo',
            icon: 'mingcute:back-2-line',
            tooltip: { text: 'Undo' },
        },
        {
            kind: 'redo',
            icon: 'mingcute:forward-2-line',
            tooltip: { text: 'Redo' },
        },
    ],
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
        {
            icon: 'mingcute:list-check-line',
            tooltip: { text: 'Lists' },
            content: {
                align: 'start',
            },
            items: [
                {
                    kind: 'bulletList',
                    icon: 'mingcute:list-check-line',
                    label: 'Bullet List',
                },
                {
                    kind: 'orderedList',
                    icon: 'mingcute:list-ordered-line',
                    label: 'Numbered List',
                },
            ],
        },
        {
            kind: 'blockquote',
            icon: 'mingcute:quote-right-line',
            tooltip: { text: 'Blockquote' },
        },
        {
            kind: 'codeBlock',
            icon: 'mingcute:code-line',
            tooltip: { text: 'Code Block' },
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
    [
        {
            slot: 'link' as const,
            icon: 'mingcute:link-line',
        },
    ],
])
</script>

<template>
    <UEditorToolbar
        :editor="props.editor"
        :items="fixedToolbarItems"
        class="bg-muted sticky inset-x-0 top-0 z-50 overflow-x-auto rounded-lg p-2"
    >
        <template #link>
            <TextEditorLinkPopover :editor="props.editor" />
        </template>
    </UEditorToolbar>
</template>
