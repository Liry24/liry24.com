<script setup lang="ts">
import type { EditorContentType, EditorProps } from '@nuxt/ui'
import { defu } from 'defu'
// import type { EditorCustomHandlers } from '@nuxt/ui'
// import { useEditorCompletion } from './useComplesion'

const editorRef = useTemplateRef('editorRef')

const input = defineModel<string>({ default: '' })

interface Props extends Pick<EditorProps, 'ui'> {
    contentType?: EditorContentType
    placeholder?: string
    editable?: boolean
    autofocus?: boolean
}
const props = withDefaults(defineProps<Props>(), {
    contentType: undefined,
    placeholder: undefined,
    editable: true,
    autofocus: false,
})

const placeholder = computed(() => props.placeholder ?? 'Type / for commands...')

// const { extension: completionExtension, handlers: aiHandlers } = useEditorCompletion(editorRef)

// const customHandlers = { ...aiHandlers } satisfies EditorCustomHandlers
</script>

<template>
    <UEditor
        ref="editorRef"
        v-slot="{ editor }"
        v-model="input"
        :content-type="props.contentType"
        :placeholder
        :editable="props.editable"
        :autofocus="props.autofocus"
        :spellcheck="false"
        :ui="
            defu(props.ui, {
                root: 'flex grow flex-col gap-2',
                content: 'flex grow',
                base: 'px-2 sm:px-2 *:my-2.5 [&_p]:leading-6',
            })
        "
    >
        <slot name="top" :editor="editor" />

        <slot :editor="editor" />

        <TextEditorBubbleToolbar :editor />
        <TextEditorSuggestionMenu :editor />

        <UEditorDragHandle :editor class="z-50" />
    </UEditor>
</template>
