<script setup lang="ts">
import { AdminModalRank } from '#components'
import equal from 'fast-deep-equal'

definePageMeta({
    middleware: 'admin',
    layout: 'admin',
    pageTransition: false,
})

const toast = useToast()
const overlay = useOverlay()

const modalRank = overlay.create(AdminModalRank)

const { data, refresh } = await useFetch('/api/ranks', {
    default: () => [],
})

const ranks = ref([...(data.value || [])])

const shouldBeSaved = computed(() => !equal(data.value, ranks.value))

const handleRefresh = async () => {
    await refresh()
    ranks.value = [...(data.value || [])]
}

const save = async () => {
    await $fetch('/api/admin/ranks', {
        method: 'PUT',
        body: {
            ranks: ranks.value,
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
</script>

<template>
    <div class="px-6">
        <UDashboardPanel id="ranks" resizable>
            <template #header>
                <UDashboardNavbar title="Ranks" icon="mingcute:chess-fill">
                    <template #trailing>
                        <span class="text-muted ml-2 text-sm">
                            {{ ranks?.length || 0 }} Ranks
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

                        <AdminModalRank @success="handleRefresh">
                            <UButton
                                icon="lucide:plus"
                                label="New Rank"
                                variant="outline"
                                color="neutral"
                            />
                        </AdminModalRank>
                    </template>
                </UDashboardNavbar>
            </template>

            <template #body>
                <UScrollArea class="h-[calc(100dvh-var(--ui-header-height))] p-6">
                    <ReorderGroup v-model:values="ranks" axis="y" class="grid gap-2">
                        <ReorderItem v-for="(rank, index) in ranks" :key="rank.id" :value="rank">
                            <div
                                class="bg-muted/50 ring-muted flex cursor-grab items-center gap-3 rounded-lg p-4 ring select-none"
                            >
                                <Icon name="mingcute:dot-grid-fill" size="20" />

                                <span class="text-sm leading-none">{{ rank.game }}</span>
                                <span class="text-muted text-sm leading-none">
                                    {{ rank.season }}
                                </span>
                                <span class="text-sm leading-none">{{ rank.rank }}</span>
                                <NuxtImg :src="rank.imageUrl" class="h-8" />

                                <div class="ml-auto flex items-center">
                                    <UButton
                                        icon="mingcute:edit-3-fill"
                                        variant="ghost"
                                        size="sm"
                                        @click="modalRank.open({ data: rank })"
                                    />

                                    <UButton
                                        icon="mingcute:close-line"
                                        variant="ghost"
                                        size="sm"
                                        @click="ranks.splice(index, 1)"
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
