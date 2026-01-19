<script setup lang="ts">
import { refDebounced } from '@vueuse/core'

const emit = defineEmits<{
    (e: 'select', icon: string): void
}>()

const providers = [
    { label: 'MingCute', value: 'mingcute' },
    { label: 'Lucide', value: 'lucide' },
    { label: 'Simple Icons', value: 'simple-icons' },
    { label: 'Material Design', value: 'ic' },
    { label: 'Remix Icon', value: 'ri' },
    { label: 'Heroicons', value: 'heroicons' },
]

const provider = ref('mingcute')
const query = ref('')
const debouncedQuery = refDebounced(query, 300)

// Default search params
const params = computed(() => ({
    query: debouncedQuery.value || 'star', // fallback search to show something initially
    prefix: provider.value,
    limit: 60,
}))

const { data, status } = useFetch('https://api.iconify.design/search', {
    params,
    lazy: true,
    server: false,
    transform: (data: { icons: string[] }) => data.icons || [],
    watch: [params],
})

const selectIcon = (icon: string) => {
    emit('select', icon)
}
</script>

<template>
    <div>
        <div class="flex items-center gap-2">
            <USelect
                v-model="provider"
                :items="providers"
                class="w-1/3"
                size="xs"
                aria-label="Select Icon Provider"
            />
            <UInput
                v-model="query"
                icon="i-lucide-search"
                placeholder="Search..."
                autofocus
                size="xs"
                class="flex-1"
                :loading="status === 'pending'"
            />
        </div>

        <div v-if="data?.length" class="grid max-h-60 grid-cols-6 gap-2 overflow-y-auto">
            <UButton
                v-for="icon in data"
                :key="icon"
                :icon="icon"
                variant="ghost"
                size="xs"
                square
                :title="icon"
                :aria-label="icon"
                @click="selectIcon(icon)"
            />
        </div>
        <div v-else-if="status !== 'pending'" class="py-4 text-center text-xs text-gray-500">
            No icons found
        </div>
    </div>
</template>
