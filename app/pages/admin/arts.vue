<script setup lang="ts">
import { AdminModalArt } from '#components'
import equal from 'fast-deep-equal'

definePageMeta({
    middleware: 'admin',
    layout: 'admin',
    pageTransition: false,
})

const toast = useToast()
const overlay = useOverlay()

const modalArt = overlay.create(AdminModalArt)

const { data, refresh } = await useFetch('/api/arts', {
    default: () => [],
})

const arts = ref([...(data.value || [])])

const shouldBeSaved = computed(() => !equal(data.value, arts.value))

const handleRefresh = async () => {
    await refresh()
    arts.value = [...(data.value || [])]
}

const save = async () => {
    await $fetch('/api/admin/arts', {
        method: 'PUT',
        body: {
            arts: arts.value,
        },
    })

    await handleRefresh()

    toast.add({
        icon: 'mingcute:check-line',
        title: 'Saved',
        description: 'Your changes have been saved',
        color: 'success',
    })
}
</script>

<template>
    <div class="px-6">
        <UDashboardPanel id="arts" resizable>
            <template #header>
                <UDashboardNavbar title="Arts" icon="mingcute:pic-fill">
                    <template #trailing>
                        <span class="text-muted ml-2 text-sm"> {{ arts?.length || 0 }} Arts </span>

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

                        <AdminModalArt @success="handleRefresh">
                            <UButton
                                icon="lucide:plus"
                                label="New Art"
                                variant="outline"
                                color="neutral"
                            />
                        </AdminModalArt>
                    </template>
                </UDashboardNavbar>
            </template>

            <template #body>
                <UScrollArea class="h-[calc(100dvh-var(--ui-header-height))] p-6">
                    <ReorderGroup v-model:values="arts" axis="y" class="grid gap-2">
                        <ReorderItem v-for="(art, index) in arts" :key="art.slug" :value="art">
                            <div
                                class="bg-muted/50 ring-muted flex cursor-grab items-center gap-3 rounded-lg p-4 ring select-none"
                            >
                                <Icon name="mingcute:dot-grid-fill" size="20" />

                                <template v-if="art.images.length">
                                    <NuxtImg
                                        :src="art.images[0]?.src"
                                        :alt="art.images[0]?.alt"
                                        class="size-12 rounded-lg object-cover"
                                    />
                                </template>

                                <span class="text-sm leading-none">{{ art.title }}</span>
                                <span class="text-muted text-sm leading-none">{{ art.slug }}</span>
                                <span class="text-sm leading-none">{{ art.href }}</span>

                                <div class="ml-auto flex items-center">
                                    <UButton
                                        icon="mingcute:edit-3-fill"
                                        variant="ghost"
                                        size="sm"
                                        @click="modalArt.open({ data: art })"
                                    />

                                    <UButton
                                        icon="mingcute:close-line"
                                        variant="ghost"
                                        size="sm"
                                        @click="arts.splice(index, 1)"
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
