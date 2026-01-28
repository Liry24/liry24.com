<script setup lang="ts">
const { src, alt } = defineProps<{
    src: string
    alt?: string
}>()

const open = defineModel<boolean>('open', { default: false })
</script>

<template>
    <UModal v-model:open="open" fullscreen :ui="{ content: 'bg-transparent' }">
        <template #content>
            <img
                :src="src"
                :alt="alt"
                class="size-full max-h-full max-w-full object-contain"
                @click="open = false"
            />
        </template>
    </UModal>
</template>
