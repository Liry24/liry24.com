<script setup lang="ts">
import equal from 'fast-deep-equal'

definePageMeta({
    middleware: 'admin',
    layout: 'admin',
    pageTransition: false,
})

const toast = useToast()

const { data, refresh } = await useFetch('/api/careers', {
    default: () => [],
})

const careers = ref([...(data.value || [])])

const shouldBeSaved = computed(() => !equal(data.value, careers.value))

const handleRefresh = async () => {
    await refresh()
    careers.value = [...(data.value || [])]
}

const save = async () => {
    await $fetch('/api/admin/careers', {
        method: 'PUT',
        body: {
            careers: careers.value,
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
        <UDashboardPanel id="careers" resizable>
            <template #header>
                <UDashboardNavbar title="Careers" icon="mingcute:suitcase-fill">
                    <template #trailing>
                        <span class="text-muted ml-2 text-sm">
                            {{ careers?.length || 0 }} Careers
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

                        <AdminModalCareer @success="handleRefresh">
                            <UButton
                                icon="lucide:plus"
                                label="New Career"
                                variant="outline"
                                color="neutral"
                            />
                        </AdminModalCareer>
                    </template>
                </UDashboardNavbar>
            </template>

            <template #body>
                <UScrollArea class="h-[calc(100dvh-var(--ui-header-height))] p-6">
                    <ReorderGroup v-model:values="careers" axis="y" class="grid gap-2">
                        <ReorderItem
                            v-for="(career, index) in careers"
                            :key="career.id"
                            :value="career"
                        >
                            <div
                                class="bg-muted/50 ring-muted flex cursor-grab items-center gap-3 rounded-lg p-4 ring select-none"
                            >
                                <Icon name="mingcute:dot-grid-fill" size="20" />

                                <span class="text-sm leading-none">{{ career.period }}</span>
                                <span class="text-muted text-sm leading-none">{{
                                    career.position
                                }}</span>
                                <span class="text-sm leading-none">{{ career.company }}</span>

                                <div class="ml-auto flex items-center">
                                    <UButton
                                        icon="mingcute:edit-3-fill"
                                        variant="ghost"
                                        size="sm"
                                    />

                                    <UButton
                                        icon="mingcute:close-line"
                                        variant="ghost"
                                        size="sm"
                                        @click="careers.splice(index, 1)"
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
