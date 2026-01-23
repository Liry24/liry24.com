<script setup lang="ts">
import { AdminModalSkill } from '#components'
import equal from 'fast-deep-equal'

const { skills, originalSkills, fetchSkills, reorderSkills, deleteSkill } = useSkill()
const overlay = useOverlay()

const modalSkill = overlay.create(AdminModalSkill)

await fetchSkills()

const categories = computed<string[]>(() =>
    [...new Set(skills.value.map((skill) => skill.category))].filter(
        (category): category is string => !!category
    )
)

const shouldBeSaved = computed(() => !equal(originalSkills.value, skills.value))

const handleRefresh = async () => {
    await fetchSkills()
}

defineShortcuts({
    n: () => {
        modalSkill.open({ categories: categories.value })
    },
})
</script>

<template>
    <div class="px-6">
        <UDashboardPanel id="skills" resizable>
            <template #header>
                <UDashboardNavbar title="Skills" icon="mingcute:award-fill">
                    <template #trailing>
                        <span class="text-muted ml-2 text-sm">
                            {{ skills?.length || 0 }} Skills
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
                            @click="reorderSkills"
                        />

                        <AdminModalSkill :categories @success="handleRefresh">
                            <UButton
                                icon="mingcute:add-line"
                                label="New Skill"
                                variant="outline"
                                color="neutral"
                                :ui="{ leadingIcon: 'size-4.5' }"
                            >
                                <template #trailing>
                                    <UKbd value="n" />
                                </template>
                            </UButton>
                        </AdminModalSkill>
                    </template>
                </UDashboardNavbar>
            </template>

            <template #body>
                <UScrollArea class="h-[calc(100dvh-var(--ui-header-height))] p-6">
                    <ReorderGroup v-model:values="skills" axis="y" class="grid gap-2">
                        <ReorderItem v-for="skill in skills" :key="skill.id" :value="skill">
                            <div
                                class="bg-muted/50 ring-muted flex cursor-grab items-center gap-3 rounded-lg p-4 ring select-none"
                            >
                                <Icon name="mingcute:dot-grid-fill" size="20" />

                                <Icon :name="skill.icon" size="20" />

                                <span class="text-sm leading-none">{{ skill.name }}</span>
                                <span class="text-muted text-sm leading-none">
                                    {{ skill.category }}
                                </span>

                                <div class="ml-auto flex items-center">
                                    <UButton
                                        icon="mingcute:edit-3-fill"
                                        variant="ghost"
                                        size="sm"
                                        @click="modalSkill.open({ data: skill, categories })"
                                    />

                                    <UButton
                                        icon="mingcute:close-line"
                                        variant="ghost"
                                        size="sm"
                                        @click="deleteSkill(skill)"
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
