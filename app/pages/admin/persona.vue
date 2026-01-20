<script setup lang="ts">
import { AdminModalLink } from '#components'
import equal from 'fast-deep-equal'

definePageMeta({
    middleware: 'admin',
    layout: 'admin',
    pageTransition: false,
})

const toast = useToast()
const overlay = useOverlay()
const location = useBrowserLocation()

const modalLink = overlay.create(AdminModalLink)

const { data, refresh } = await useFetch('/api/socials', {
    default: () => [],
})

const socials = ref([...(data.value || [])])

const shouldBeSaved = computed(() => !equal(data.value, socials.value))

const handleRefresh = async () => {
    await refresh()
    socials.value = [...(data.value || [])]
}

const save = async () => {
    await $fetch('/api/admin/socials', {
        method: 'PUT',
        body: {
            links: socials.value,
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
        <UDashboardPanel id="persona" resizable>
            <template #header>
                <UDashboardNavbar title="Persona" icon="mingcute:sparkles-fill">
                    <template #trailing>
                        <span class="text-muted ml-2 text-sm">
                            {{ socials?.length || 0 }} Links
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

                        <AdminModalLink @success="handleRefresh">
                            <UButton
                                icon="mingcute:add-fill"
                                label="New Link"
                                variant="outline"
                                color="neutral"
                                :ui="{
                                    leadingIcon: 'size-4.5',
                                }"
                            />
                        </AdminModalLink>
                    </template>
                </UDashboardNavbar>
            </template>

            <template #body>
                <UScrollArea class="h-[calc(100dvh-var(--ui-header-height))] p-6">
                    <ReorderGroup v-model:values="socials" axis="y" class="grid gap-2">
                        <ReorderItem
                            v-for="(social, index) in socials"
                            :key="social.id"
                            :value="social"
                        >
                            <div
                                class="bg-muted/50 ring-muted flex cursor-grab items-center gap-3 rounded-lg p-4 ring select-none"
                            >
                                <Icon name="mingcute:dot-grid-fill" size="20" />

                                <Icon :name="social.icon" size="18" />
                                <span class="text-sm leading-none">{{ social.label }}</span>

                                <span class="text-muted max-w-64 truncate text-sm">
                                    {{ social.href.replace('https://', '') }}
                                </span>
                                <template v-if="social.alias">
                                    <Icon name="mingcute:arrow-right-line" />
                                    <span class="text-muted text-sm">
                                        {{
                                            `${location.origin?.replace('https://', '')}/${social.alias}`
                                        }}
                                    </span>
                                </template>

                                <div class="ml-auto flex items-center">
                                    <UButton
                                        icon="mingcute:edit-3-fill"
                                        variant="ghost"
                                        size="sm"
                                        @click="modalLink.open({ data: social })"
                                    />

                                    <UButton
                                        icon="mingcute:close-line"
                                        variant="ghost"
                                        size="sm"
                                        @click="socials.splice(index, 1)"
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
