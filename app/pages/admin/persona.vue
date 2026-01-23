<script setup lang="ts">
import { AdminModalSocial } from '#components'
import equal from 'fast-deep-equal'

const { socials, originalSocials, fetchSocials, reorderSocials, deleteSocial } = useSocial()
const overlay = useOverlay()
const location = useBrowserLocation()

const modalSocial = overlay.create(AdminModalSocial)

await fetchSocials()

const shouldBeSaved = computed(() => !equal(originalSocials.value, socials.value))

const handleRefresh = async () => {
    await fetchSocials()
}

defineShortcuts({
    n: () => {
        modalSocial.open()
    },
})
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
                            @click="reorderSocials"
                        />

                        <AdminModalSocial @success="handleRefresh">
                            <UButton
                                icon="mingcute:add-line"
                                label="New Link"
                                variant="outline"
                                color="neutral"
                                :ui="{ leadingIcon: 'size-4.5' }"
                            >
                                <template #trailing>
                                    <UKbd value="n" />
                                </template>
                            </UButton>
                        </AdminModalSocial>
                    </template>
                </UDashboardNavbar>
            </template>

            <template #body>
                <UScrollArea class="h-[calc(100dvh-var(--ui-header-height))] p-6">
                    <ReorderGroup v-model:values="socials" axis="y" class="grid gap-2">
                        <ReorderItem v-for="social in socials" :key="social.id" :value="social">
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
                                        @click="modalSocial.open({ data: social })"
                                    />

                                    <UButton
                                        icon="mingcute:close-line"
                                        variant="ghost"
                                        size="sm"
                                        @click="deleteSocial(social)"
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
