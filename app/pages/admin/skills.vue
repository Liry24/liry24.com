<script setup lang="ts">
import equal from 'fast-deep-equal'

definePageMeta({
    middleware: 'admin',
    layout: 'admin',
    pageTransition: false,
})

const toast = useToast()

const { data, refresh } = await useFetch('/api/skills', {
    default: () => [],
})

const skills = ref([...(data.value || [])])
const categories = computed<string[]>(() =>
    skills.value.map((skill) => skill.category).filter((category): category is string => !!category)
)
const openModalSkill = ref(false)

const shouldBeSaved = computed(() => !equal(data.value, skills.value))

const handleRefresh = async () => {
    await refresh()
    skills.value = [...(data.value || [])]
}

const save = async () => {
    await $fetch('/api/admin/skills', {
        method: 'PUT',
        body: {
            skills: skills.value,
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
        openModalSkill.value = true
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
                            @click="save"
                        />

                        <AdminModalSkill
                            v-model:open="openModalSkill"
                            :categories
                            @success="handleRefresh"
                        >
                            <UButton
                                icon="lucide:plus"
                                label="New Skill"
                                variant="outline"
                                color="neutral"
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
                        <ReorderItem
                            v-for="(skill, index) in skills"
                            :key="skill.id"
                            :value="skill"
                        >
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
                                    />

                                    <UButton
                                        icon="mingcute:close-line"
                                        variant="ghost"
                                        size="sm"
                                        @click="skills.splice(index, 1)"
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
