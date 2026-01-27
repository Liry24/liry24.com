<script setup lang="ts">
import { refDebounced, useInfiniteScroll } from '@vueuse/core'

interface IconifyCollectionResponse {
    uncategorized?: string[]
    categories?: Record<string, string[]>
    [key: string]: unknown
}

interface IconifySearchResponse {
    icons: string[]
    total: number
    [key: string]: unknown
}

const emit = defineEmits<{
    (e: 'select', icon: string): void
}>()

const providers = [
    { label: 'MingCute', value: 'mingcute' },
    { label: 'Lucide', value: 'lucide' },
    { label: 'Simple Icons', value: 'simple-icons' },
]

const provider = ref('mingcute')
const query = ref('')
const debouncedQuery = refDebounced(query, 300)

const icons = ref<string[]>([])
const loading = ref(false)
const canLoadMore = ref(true)
const container = ref<HTMLElement | null>(null)
const allCollectionIcons = ref<string[]>([])

const fetchIcons = async () => {
    if (loading.value || !canLoadMore.value) return

    loading.value = true
    try {
        const limit = 60
        const start = icons.value.length

        if (!debouncedQuery.value) {
            if (allCollectionIcons.value.length === 0) {
                const currentPrefix = provider.value
                const res = await $fetch<IconifyCollectionResponse>(
                    `https://api.iconify.design/collection?prefix=${currentPrefix}`
                )
                const all: string[] = []
                if (res.uncategorized)
                    all.push(...res.uncategorized.map((i) => `${currentPrefix}:${i}`))

                if (res.categories)
                    Object.values(res.categories).forEach((cats) =>
                        all.push(...cats.map((i) => `${currentPrefix}:${i}`))
                    )

                allCollectionIcons.value = all
            }

            const nextBatch = allCollectionIcons.value.slice(start, start + limit)
            icons.value.push(...nextBatch)

            if (icons.value.length >= allCollectionIcons.value.length) canLoadMore.value = false
        } else {
            const res = await $fetch<IconifySearchResponse>('https://api.iconify.design/search', {
                params: {
                    query: debouncedQuery.value,
                    prefix: provider.value,
                    limit,
                    start,
                },
            })

            if (res.icons) {
                icons.value.push(...res.icons)
                if (res.icons.length < limit || (res.total && icons.value.length >= res.total)) {
                    canLoadMore.value = false
                }
            } else {
                canLoadMore.value = false
            }
        }
    } catch (e) {
        console.error(e)
        canLoadMore.value = false
    } finally {
        loading.value = false
    }
}

watch(
    [debouncedQuery, provider],
    () => {
        icons.value = []
        allCollectionIcons.value = []
        canLoadMore.value = true
        fetchIcons()
    },
    { immediate: true }
)

useInfiniteScroll(
    container,
    () => {
        fetchIcons()
    },
    { distance: 10 }
)

const selectIcon = (icon: string) => {
    emit('select', icon)
}
</script>

<template>
    <div class="flex flex-col gap-4">
        <div class="flex items-center gap-2">
            <USelect
                v-model="provider"
                :items="providers"
                class="w-1/3"
                size="sm"
                aria-label="Select Icon Provider"
            />
            <UInput
                v-model="query"
                icon="i-lucide-search"
                placeholder="Search..."
                autofocus
                size="sm"
                class="flex-1"
                :loading="loading"
            />
        </div>

        <div
            v-if="icons.length"
            ref="container"
            class="grid max-h-60 grid-cols-6 gap-1 overflow-y-auto"
        >
            <UButton
                v-for="icon in icons"
                :key="icon"
                :aria-label="icon"
                :icon="icon"
                variant="ghost"
                :ui="{ leadingIcon: 'size-6' }"
                class="flex items-center justify-center p-2"
                @click="selectIcon(icon)"
            />
        </div>
        <div v-else-if="!loading" class="py-4 text-center text-xs text-gray-500">
            No icons found
        </div>
    </div>
</template>
