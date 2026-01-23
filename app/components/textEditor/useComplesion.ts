import type { Editor } from '@tiptap/vue-3'

import { useCompletion } from '@ai-sdk/vue'
import { Extension } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { useDebounceFn } from '@vueuse/core'

type CompletionMode =
    | 'continue'
    | 'fix'
    | 'extend'
    | 'reduce'
    | 'simplify'
    | 'summarize'
    | 'translate'

export interface CompletionOptions {
    /**
     * Debounce delay in ms before triggering completion
     * @defaultValue 250
     */
    debounce?: number
    /**
     * Characters that should prevent completion from triggering
     * @defaultValue ['/', ':', '@']
     */
    triggerCharacters?: string[]
    /**
     * Called when completion should be triggered, receives the text before cursor
     */
    onTrigger?: (textBefore: string) => void
    /**
     * Called when suggestion is accepted
     */
    onAccept?: () => void
    /**
     * Called when suggestion is dismissed
     */
    onDismiss?: () => void
}

export interface CompletionStorage {
    suggestion: string
    position: number | undefined
    visible: boolean
    debouncedTrigger: ((editor: Editor) => void) | null
    setSuggestion: (text: string) => void
    clearSuggestion: () => void
}

export const Completion = Extension.create<CompletionOptions, CompletionStorage>({
    name: 'completion',

    addOptions() {
        return {
            debounce: 500,
            triggerCharacters: ['/', ':', '@'],
            onTrigger: undefined,
            onAccept: undefined,
            onDismiss: undefined,
        }
    },

    addStorage() {
        return {
            suggestion: '',
            position: undefined as number | undefined,
            visible: false,
            debouncedTrigger: null as ((editor: Editor) => void) | null,
            setSuggestion(text: string) {
                this.suggestion = text
            },
            clearSuggestion() {
                this.suggestion = ''
                this.position = undefined
                this.visible = false
            },
        }
    },

    addProseMirrorPlugins() {
        const storage = this.storage

        return [
            new Plugin({
                props: {
                    decorations(state) {
                        if (
                            !storage.visible ||
                            !storage.suggestion ||
                            storage.position === undefined
                        )
                            return DecorationSet.empty

                        const widget = Decoration.widget(
                            storage.position,
                            () => {
                                const span = document.createElement('span')
                                span.className = 'completion-suggestion'
                                span.textContent = storage.suggestion
                                span.style.cssText =
                                    'color: var(--ui-text-muted); opacity: 0.6; pointer-events: none;'
                                return span
                            },
                            { side: 1 }
                        )

                        return DecorationSet.create(state.doc, [widget])
                    },
                },
            }),
        ]
    },

    addKeyboardShortcuts() {
        return {
            Tab: ({ editor }) => {
                if (
                    !this.storage.visible ||
                    !this.storage.suggestion ||
                    this.storage.position === undefined
                )
                    return false

                // Store values before clearing
                const suggestion = this.storage.suggestion
                const position = this.storage.position

                // Clear suggestion first
                this.storage.clearSuggestion()

                // Force decoration update
                editor.view.dispatch(editor.state.tr.setMeta('completionUpdate', true))

                // Insert the suggestion text
                editor.chain().focus().insertContentAt(position, suggestion).run()

                this.options.onAccept?.()
                return true
            },
            Escape: ({ editor }) => {
                if (this.storage.visible) {
                    this.storage.clearSuggestion()
                    // Force decoration update
                    editor.view.dispatch(editor.state.tr.setMeta('completionUpdate', true))
                    this.options.onDismiss?.()
                    return true
                }
                return false
            },
        }
    },

    onUpdate({ editor }) {
        // Clear suggestion on any edit
        if (this.storage.visible) {
            this.storage.clearSuggestion()
            this.options.onDismiss?.()
        }

        // Debounced trigger check
        this.storage.debouncedTrigger?.(editor as unknown as Editor)
    },

    onSelectionUpdate() {
        if (this.storage.visible) {
            this.storage.clearSuggestion()
            this.options.onDismiss?.()
        }
    },

    onCreate() {
        const storage = this.storage
        const options = this.options

        // Create debounced trigger function for this instance
        this.storage.debouncedTrigger = useDebounceFn((editor: Editor) => {
            if (!options.onTrigger) return

            const { state } = editor
            const { selection } = state
            const { $from } = selection

            // Only suggest at end of block with content
            const isAtEndOfBlock = $from.parentOffset === $from.parent.content.size
            const hasContent = $from.parent.textContent.trim().length > 0
            const textContent = $from.parent.textContent

            // Don't trigger if sentence is complete (ends with punctuation)
            const endsWithPunctuation = /[.!?]\s*$/.test(textContent)

            // Don't trigger if text ends with trigger characters
            const triggerChars = options.triggerCharacters || []
            const endsWithTrigger = triggerChars.some((char) => textContent.endsWith(char))

            if (!isAtEndOfBlock || !hasContent || endsWithPunctuation || endsWithTrigger) return

            // Set position and mark as visible
            storage.position = selection.from
            storage.visible = true

            // Get text before cursor as context
            const textBefore = state.doc.textBetween(0, selection.from, '\n')
            options.onTrigger(textBefore)
        }, options.debounce || 250)
    },

    onDestroy() {
        this.storage.debouncedTrigger = null
    },
})

export interface UseEditorCompletionOptions {
    api?: string
}

export const useEditorCompletion = (
    editorRef: Ref<{ editor: Editor | undefined } | null | undefined>,
    options: UseEditorCompletionOptions = {}
) => {
    // State for direct insertion/transform mode
    const insertState = ref<{
        pos: number
        deleteRange?: { from: number; to: number }
    }>()
    const mode = ref<CompletionMode>('continue')
    const language = ref<string>()

    // Helper to get completion storage
    const getCompletionStorage = () => {
        const storage = editorRef.value?.editor?.storage as
            | Record<string, CompletionStorage>
            | undefined
        return storage?.completion
    }

    const { completion, complete, isLoading, stop, setCompletion } = useCompletion({
        api: options.api || '/api/admin/completion',
        streamProtocol: 'text',
        body: computed(() => ({
            mode: mode.value,
            lang: language.value,
        })),
        onFinish: () => {
            // For inline suggestion mode, don't clear - let user accept with Tab
            const storage = getCompletionStorage()
            if (mode.value === 'continue' && storage?.visible) return

            insertState.value = undefined
        },
        onError: (error) => {
            console.error('AI completion error:', error)
            insertState.value = undefined
            getCompletionStorage()?.clearSuggestion()
        },
    })

    // Watch completion for inline suggestion updates
    watch(completion, (newCompletion, oldCompletion) => {
        const editor = editorRef.value?.editor
        if (!editor || !newCompletion) return

        const storage = getCompletionStorage()
        if (storage?.visible) {
            // Update inline suggestion
            storage.setSuggestion(newCompletion)
            editor.view.dispatch(editor.state.tr.setMeta('completionUpdate', true))
        } else if (insertState.value) {
            // Direct insertion/transform mode (from toolbar actions)

            // If this is the first chunk and we have a selection to replace, delete it first
            if (insertState.value.deleteRange && !oldCompletion) {
                editor.chain().focus().deleteRange(insertState.value.deleteRange).run()
                insertState.value.deleteRange = undefined
            }

            let delta = newCompletion.slice(oldCompletion?.length || 0)
            if (delta) {
                // For single-paragraph transforms, replace all line breaks with spaces
                if (['fix', 'simplify', 'translate'].includes(mode.value)) {
                    delta = delta.replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ')
                }

                // For "continue" mode, add a space before if needed (first chunk only)
                if (mode.value === 'continue' && !oldCompletion) {
                    const textBefore = editor.state.doc.textBetween(
                        Math.max(0, insertState.value.pos - 1),
                        insertState.value.pos
                    )
                    if (textBefore && !/\s/.test(textBefore)) {
                        delta = ' ' + delta
                    }
                }

                editor
                    .chain()
                    .focus()
                    .command(({ tr }) => {
                        tr.insertText(delta, insertState.value!.pos)
                        return true
                    })
                    .run()
                insertState.value.pos += delta.length
            }
        }
    })

    const triggerTransform = (
        editor: Editor,
        transformMode: Exclude<CompletionMode, 'continue'>,
        lang?: string
    ) => {
        if (isLoading.value) return

        getCompletionStorage()?.clearSuggestion()

        const { state } = editor
        const { selection } = state

        if (selection.empty) return

        mode.value = transformMode
        language.value = lang
        const selectedText = state.doc.textBetween(selection.from, selection.to)

        // Replace the selected text with the transformed version
        insertState.value = {
            pos: selection.from,
            deleteRange: { from: selection.from, to: selection.to },
        }

        complete(selectedText)
    }

    const triggerContinue = (editor: Editor) => {
        if (isLoading.value) return

        mode.value = 'continue'
        getCompletionStorage()?.clearSuggestion()
        const { state } = editor
        const { selection } = state

        if (selection.empty) {
            // No selection: continue from cursor position
            const textBefore = state.doc.textBetween(0, selection.from, '\n')
            insertState.value = { pos: selection.from }
            complete(textBefore)
        } else {
            // Text selected: append completion after the selection
            const selectedText = state.doc.textBetween(selection.from, selection.to)
            insertState.value = { pos: selection.to }
            complete(selectedText)
        }
    }

    // Configure Completion extension
    const extension = Completion.configure({
        onTrigger: (textBefore) => {
            if (isLoading.value) return
            mode.value = 'continue'
            complete(textBefore)
        },
        onAccept: () => {
            setCompletion('')
        },
        onDismiss: () => {
            stop()
            setCompletion('')
        },
    })

    // Create handlers for toolbar
    const handlers = {
        aiContinue: {
            canExecute: () => !isLoading.value,
            execute: (editor: Editor) => {
                triggerContinue(editor)
                return editor.chain()
            },
            isActive: () => !!(isLoading.value && mode.value === 'continue'),
            isDisabled: () => !!isLoading.value,
        },
        aiFix: {
            canExecute: (editor: Editor) => !editor.state.selection.empty && !isLoading.value,
            execute: (editor: Editor) => {
                triggerTransform(editor, 'fix')
                return editor.chain()
            },
            isActive: () => !!(isLoading.value && mode.value === 'fix'),
            isDisabled: (editor: Editor) => editor.state.selection.empty || !!isLoading.value,
        },
        aiExtend: {
            canExecute: (editor: Editor) => !editor.state.selection.empty && !isLoading.value,
            execute: (editor: Editor) => {
                triggerTransform(editor, 'extend')
                return editor.chain()
            },
            isActive: () => !!(isLoading.value && mode.value === 'extend'),
            isDisabled: (editor: Editor) => editor.state.selection.empty || !!isLoading.value,
        },
        aiReduce: {
            canExecute: (editor: Editor) => !editor.state.selection.empty && !isLoading.value,
            execute: (editor: Editor) => {
                triggerTransform(editor, 'reduce')
                return editor.chain()
            },
            isActive: () => !!(isLoading.value && mode.value === 'reduce'),
            isDisabled: (editor: Editor) => editor.state.selection.empty || !!isLoading.value,
        },
        aiSimplify: {
            canExecute: (editor: Editor) => !editor.state.selection.empty && !isLoading.value,
            execute: (editor: Editor) => {
                triggerTransform(editor, 'simplify')
                return editor.chain()
            },
            isActive: () => !!(isLoading.value && mode.value === 'simplify'),
            isDisabled: (editor: Editor) => editor.state.selection.empty || !!isLoading.value,
        },
        aiSummarize: {
            canExecute: (editor: Editor) => !editor.state.selection.empty && !isLoading.value,
            execute: (editor: Editor) => {
                triggerTransform(editor, 'summarize')
                return editor.chain()
            },
            isActive: () => !!(isLoading.value && mode.value === 'summarize'),
            isDisabled: (editor: Editor) => editor.state.selection.empty || !!isLoading.value,
        },
        aiTranslate: {
            canExecute: (editor: Editor) => !editor.state.selection.empty && !isLoading.value,
            execute: (editor: Editor, cmd: { language?: string } | undefined) => {
                triggerTransform(editor, 'translate', cmd?.language)
                return editor.chain()
            },
            isActive: (_editor: Editor, cmd: { language?: string } | undefined) =>
                !!(
                    isLoading.value &&
                    mode.value === 'translate' &&
                    language.value === cmd?.language
                ),
            isDisabled: (editor: Editor) => editor.state.selection.empty || !!isLoading.value,
        },
    }

    return {
        extension,
        handlers,
        isLoading,
        mode,
    }
}
