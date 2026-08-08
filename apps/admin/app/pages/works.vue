<script setup lang="ts">
import { LazyAdminModalWork } from '#components'

const { works, changed, fetchWorks, reorderWorks, deleteWork } = useWork()
const modalWork = useOverlay().create(LazyAdminModalWork)

const visibleAdditionalFields = ref<{ name: keyof Work }[]>([
    { name: 'slug' },
    { name: 'category' },
    { name: 'description' },
    { name: 'price' },
    { name: 'href' },
    { name: 'style' },
])

defineShortcuts({
    n: () => {
        modalWork.open()
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
                            aria-label="Refresh"
                            icon="mingcute:refresh-2-line"
                            variant="ghost"
                            size="sm"
                            @click="fetchWorks()"
                        />
                    </template>

                    <template #right>
                        <UButton
                            v-if="changed"
                            loading-auto
                            icon="mingcute:check-line"
                            label="Save"
                            color="neutral"
                            @click="reorderWorks()"
                        />

                        <AdminModalWork @success="fetchWorks()">
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
                        <ReorderItem v-for="work in works" :key="work.slug" :value="work">
                            <div
                                class="bg-muted/70 ring-muted/50 flex cursor-grab items-center gap-2 rounded-xl px-3 py-4 ring select-none"
                            >
                                <Icon name="mingcute:dots-line" size="20" />

                                <NuxtImg
                                    v-if="work.image"
                                    :src="work.image"
                                    alt=""
                                    :height="48"
                                    class="mr-2 size-12 rounded-lg object-cover"
                                />

                                <div class="flex flex-col gap-3">
                                    <span class="text-sm leading-none">{{ work.title }}</span>

                                    <div class="flex flex-wrap gap-2">
                                        <div
                                            v-for="field in visibleAdditionalFields.filter(
                                                (f) => work[f.name],
                                            )"
                                            :key="field.name"
                                            class="bg-default text-muted flex gap-1 rounded-lg p-3 text-xs leading-none"
                                        >
                                            {{ field.name }}:
                                            <span class="text-default font-mono">
                                                {{ work[field.name] }}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div class="ml-auto flex items-center">
                                    <UButton
                                        aria-label="Edit"
                                        icon="mingcute:edit-3-fill"
                                        variant="ghost"
                                        size="sm"
                                        @click="modalWork.open({ data: work })"
                                    />

                                    <UButton
                                        aria-label="Delete"
                                        icon="mingcute:close-line"
                                        variant="ghost"
                                        size="sm"
                                        @click="deleteWork(work.slug)"
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
