<script setup lang="ts">
import { AdminModalWork } from '#components'
import equal from 'fast-deep-equal'

definePageMeta({
    middleware: 'admin',
    layout: 'admin',
    pageTransition: false,
})

const toast = useToast()
const overlay = useOverlay()

const modalWork = overlay.create(AdminModalWork)

const { data, refresh } = await useFetch('/api/works', {
    default: () => [],
})
const works = ref([...(data.value || [])])
const categories = computed<string[]>(() =>
    [...new Set(works.value.map((work) => work.category))].filter(
        (category): category is string => !!category
    )
)

const shouldBeSaved = computed(() => !equal(data.value, works.value))

const handleRefresh = async () => {
    await refresh()
    works.value = [...(data.value || [])]
}

const save = async () => {
    await $fetch('/api/admin/works', {
        method: 'PUT',
        body: {
            works: works.value,
        },
    })

    toast.add({
        icon: 'mingcute:check-line',
        title: 'Saved',
        description: 'Your changes have been saved',
        color: 'success',
    })

    handleRefresh()
}

defineShortcuts({
    n: () => {
        modalWork.open({ categories: categories.value })
    },
})
</script>

<template>
    <div class="px-6">
        <UDashboardPanel id="works" resizable>
            <template #header>
                <UDashboardNavbar title="Works" icon="mingcute:package-2-fill">
                    <template #trailing>
                        <span class="text-muted ml-2 text-sm">
                            {{ works?.length || 0 }} Works
                        </span>

                        <UButton
                            loading-auto
                            icon="mingcute:refresh-2-line"
                            variant="ghost"
                            size="sm"
                            @click="handleRefresh"
                        />
                    </template>

                    <template #right>
                        <UButton
                            v-if="shouldBeSaved"
                            loading-auto
                            icon="mingcute:check-line"
                            label="Save"
                            color="neutral"
                            @click="save"
                        />

                        <AdminModalWork :categories @success="handleRefresh">
                            <UButton
                                icon="mingcute:add-line"
                                label="New Work"
                                variant="outline"
                                color="neutral"
                                :ui="{ leadingIcon: 'size-4.5' }"
                            >
                                <template #trailing>
                                    <UKbd value="n" />
                                </template>
                            </UButton>
                        </AdminModalWork>
                    </template>
                </UDashboardNavbar>
            </template>

            <template #body>
                <UScrollArea class="h-[calc(100dvh-var(--ui-header-height))] p-6">
                    <ReorderGroup v-model:values="works" axis="y" class="grid gap-2">
                        <ReorderItem v-for="(work, index) in works" :key="work.slug" :value="work">
                            <div
                                class="bg-muted/50 ring-muted flex cursor-grab items-center gap-3 rounded-lg p-4 ring select-none"
                            >
                                <Icon name="mingcute:dot-grid-fill" size="20" />

                                <NuxtImg
                                    :src="work.image || undefined"
                                    class="size-12 rounded-lg object-cover"
                                />

                                <span class="text-sm leading-none">{{ work.title }}</span>
                                <span class="text-muted text-sm leading-none">{{ work.slug }}</span>

                                <div class="ml-auto flex items-center">
                                    <UButton
                                        icon="mingcute:edit-3-fill"
                                        variant="ghost"
                                        size="sm"
                                        @click="modalWork.open({ data: work, categories })"
                                    />

                                    <UButton
                                        icon="mingcute:close-line"
                                        variant="ghost"
                                        size="sm"
                                        @click="works.splice(index, 1)"
                                    />
                                </div>
                            </div>
                        </ReorderItem>
                    </ReorderGroup>
                </UScrollArea>
            </template>
        </UDashboardPanel>
    </div>
</template>
