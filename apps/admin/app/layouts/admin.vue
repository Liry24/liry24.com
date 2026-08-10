<script lang="ts" setup>
type SiteBuild = {
    id: string
    status: 'queued' | 'initializing' | 'running' | 'stopped' | 'unknown'
    outcome: 'success' | 'fail' | 'skipped' | 'cancelled' | 'terminated' | null | 'unknown'
    trigger: 'push' | 'pull_request' | 'manual' | 'api' | 'deploy_hook' | 'unknown'
    branch: string | null
    createdAt: string | null
    initializingAt: string | null
    runningAt: string | null
    stoppedAt: string | null
    canCancel: boolean
}

const { app } = useAppConfig()
const { session, signOut } = useAuth()

const { data: users } = useFetch('/api/users')
const { data: posts } = useFetch('/api/posts', { key: 'posts' })
const toast = useToast()

const sidebarCollapsed = ref(false)
const siteBuildLoading = ref(false)
const siteBuildCanceling = ref(false)
const siteBuildStatusAvailable = ref(true)
const siteBuild = ref<SiteBuild | null>(null)
const cancelBuildModalOpen = ref(false)
const observedActiveBuildId = ref<string>()
const notifiedBuildIds = new Set<string>()
let siteBuildPoll: number | undefined

const siteBuildIndicator = computed(() => {
    if (!siteBuildStatusAvailable.value)
        return {
            label: 'Status unavailable',
            icon: 'mingcute:warning-line',
            color: 'text-warning',
            active: false,
        }

    const build = siteBuild.value
    if (!build) return null
    if (build.status === 'queued')
        return {
            label: 'Queued',
            icon: 'mingcute:time-line',
            color: 'text-muted',
            active: true,
        }
    if (build.status === 'initializing')
        return {
            label: 'Initializing',
            icon: 'mingcute:loading-fill',
            color: 'text-info',
            active: true,
        }
    if (build.status === 'running')
        return {
            label: 'Building / Deploying',
            icon: 'mingcute:loading-fill',
            color: 'text-info',
            active: true,
        }

    const outcomes = {
        success: ['Succeeded', 'mingcute:check-circle-fill', 'text-success'],
        fail: ['Failed', 'mingcute:close-circle-fill', 'text-error'],
        cancelled: ['Canceled', 'mingcute:stop-circle-fill', 'text-warning'],
        terminated: ['Terminated', 'mingcute:stop-circle-fill', 'text-warning'],
        skipped: ['Skipped', 'mingcute:skip-forward-fill', 'text-muted'],
    } as const
    const outcome =
        build.outcome && build.outcome !== 'unknown' ? outcomes[build.outcome] : undefined
    return outcome
        ? { label: outcome[0], icon: outcome[1], color: outcome[2], active: false }
        : {
              label: 'Status unavailable',
              icon: 'mingcute:warning-line',
              color: 'text-warning',
              active: false,
          }
})

const cancelBuildDescription = computed(() => {
    const build = siteBuild.value
    if (!build) return 'Cancel this build?'
    return `Cancel build ${build.id.slice(0, 8)}${build.branch ? ` on ${build.branch}` : ''}?`
})

const stopSiteBuildPolling = () => {
    if (siteBuildPoll) window.clearTimeout(siteBuildPoll)
    siteBuildPoll = undefined
}

const notifyBuildFinished = (build: SiteBuild) => {
    if (observedActiveBuildId.value !== build.id || notifiedBuildIds.has(build.id)) return
    notifiedBuildIds.add(build.id)
    observedActiveBuildId.value = undefined

    const failed = build.outcome === 'fail'
    const canceled = build.outcome === 'cancelled' || build.outcome === 'terminated'
    toast.add({
        icon: failed
            ? 'mingcute:close-line'
            : canceled
              ? 'mingcute:stop-line'
              : 'mingcute:check-line',
        title: failed ? 'Build failed' : canceled ? 'Build canceled' : 'Build completed',
        color: failed ? 'error' : canceled ? 'warning' : 'success',
    })
}

const refreshSiteBuild = async (buildId?: string) => {
    stopSiteBuildPolling()
    try {
        const result = await $fetch<{ build: SiteBuild | null }>(
            buildId ? `/api/site-build/${encodeURIComponent(buildId)}` : '/api/site-build',
        )
        siteBuildStatusAvailable.value = true
        siteBuild.value = result.build
        const hasFinalOutcome = result.build?.outcome && result.build.outcome !== 'unknown'
        const awaitingOutcome = result.build?.status === 'stopped' && !hasFinalOutcome
        if (result.build?.canCancel) observedActiveBuildId.value = result.build.id
        else if (result.build && hasFinalOutcome) notifyBuildFinished(result.build)
        if (!result.build?.canCancel) cancelBuildModalOpen.value = false

        const nextBuildId =
            result.build && (result.build.canCancel || awaitingOutcome)
                ? result.build.id
                : undefined
        siteBuildPoll = window.setTimeout(
            () => void refreshSiteBuild(nextBuildId),
            nextBuildId ? 3_000 : 60_000,
        )
    } catch (error) {
        console.error(error)
        siteBuildStatusAvailable.value = false
        siteBuildPoll = window.setTimeout(() => void refreshSiteBuild(), 60_000)
    }
}

const publishSite = async () => {
    stopSiteBuildPolling()
    siteBuildLoading.value = true

    try {
        const result = await $fetch<{ buildId: string; alreadyExists: boolean }>(
            '/api/site-build',
            {
                method: 'POST',
            },
        )
        observedActiveBuildId.value = result.buildId
        toast.add({
            icon: 'mingcute:check-line',
            title: '更新を受け付けました',
            description: result.alreadyExists
                ? '進行中の公開サイトビルドを追跡します。'
                : '公開サイトのビルドを開始しました。',
            color: 'success',
        })
        await refreshSiteBuild(result.buildId)
    } catch (error) {
        console.error(error)
        toast.add({
            icon: 'mingcute:close-line',
            title: '更新を開始できませんでした',
            description: 'Deploy Hookの設定と状態を確認してください。',
            color: 'error',
        })
        siteBuildPoll = window.setTimeout(() => void refreshSiteBuild(), 60_000)
    } finally {
        siteBuildLoading.value = false
    }
}

const cancelBuild = async () => {
    const build = siteBuild.value
    if (!build?.canCancel) return

    stopSiteBuildPolling()
    siteBuildCanceling.value = true
    try {
        await $fetch(`/api/site-build/${encodeURIComponent(build.id)}/cancel`, { method: 'PUT' })
        cancelBuildModalOpen.value = false
        toast.add({ title: 'Build cancellation requested', color: 'warning' })
    } catch (error) {
        console.error(error)
        toast.add({ title: 'Could not cancel the build', color: 'error' })
    } finally {
        siteBuildCanceling.value = false
        await refreshSiteBuild(build.id)
    }
}

onMounted(() => void refreshSiteBuild())
onBeforeUnmount(stopSiteBuildPolling)
</script>

<template>
    <div class="bg-elevated/70 fixed inset-0">
        <UDashboardGroup unit="rem" class="bg-default m-1 rounded-lg">
            <UDashboardSidebar
                id="default"
                collapsible
                resizable
                :collapsed="sidebarCollapsed"
                :ui="{
                    root: 'min-h-[calc(100svh-0.5rem)]',
                    header: cn(sidebarCollapsed && ''),
                    footer: 'lg:border-t lg:border-default p-1',
                }"
            >
                <template #header="{ collapsed }">
                    <div
                        :class="
                            cn(
                                'flex w-full items-center gap-2 pl-2',
                                collapsed && 'mt-8 mb-8 flex-col pl-0',
                            )
                        "
                    >
                        <UButton
                            to="/"
                            icon="liria:liria"
                            :label="collapsed ? undefined : 'Admin'"
                            variant="link"
                            color="neutral"
                            size="sm"
                            class="text-highlighted gap-1.5 p-0 text-base font-extralight"
                        />
                        <UButton
                            aria-label="Toggle sidebar"
                            :icon="
                                collapsed
                                    ? 'mingcute:layout-leftbar-open-fill'
                                    : 'mingcute:layout-leftbar-close-fill'
                            "
                            variant="ghost"
                            size="sm"
                            :class="cn(!collapsed && 'ml-auto')"
                            @click="sidebarCollapsed = !sidebarCollapsed"
                        />
                    </div>
                </template>

                <template #default="{ collapsed }">
                    <AdminNav
                        :links="[
                            {
                                to: '/persona',
                                icon: 'mingcute:sparkles-fill',
                                label: 'Persona',
                            },
                            {
                                to: '/works',
                                icon: 'mingcute:package-2-fill',
                                label: 'Works',
                            },
                            {
                                to: '/arts',
                                icon: 'mingcute:pic-fill',
                                label: 'Arts',
                            },
                            {
                                to: '/careers',
                                icon: 'mingcute:suitcase-fill',
                                label: 'Careers',
                            },
                            {
                                to: '/skills',
                                icon: 'mingcute:award-fill',
                                label: 'Skills',
                            },
                            {
                                to: '/ranks',
                                icon: 'mingcute:chess-fill',
                                label: 'Ranks',
                            },
                        ]"
                        :collapsed
                    />

                    <div class="grid gap-1">
                        <UButton
                            :label="collapsed ? undefined : 'Apply Changes'"
                            aria-label="Apply Changes"
                            title="Apply Changes"
                            icon="mingcute:upload-3-fill"
                            :loading="siteBuildLoading"
                            :disabled="
                                siteBuildCanceling ||
                                (siteBuildStatusAvailable && Boolean(siteBuild?.canCancel))
                            "
                            color="neutral"
                            variant="soft"
                            block
                            @click="publishSite"
                        />

                        <div
                            v-if="siteBuildIndicator"
                            role="status"
                            :aria-label="siteBuildIndicator.label"
                            :title="siteBuildIndicator.label"
                            :class="
                                cn(
                                    'flex items-center gap-1.5 px-2 text-xs',
                                    siteBuildIndicator.color,
                                    collapsed && 'justify-center px-0',
                                )
                            "
                        >
                            <UIcon
                                :name="siteBuildIndicator.icon"
                                :class="cn('size-4', siteBuildIndicator.active && 'animate-spin')"
                            />
                            <span v-if="!collapsed">{{ siteBuildIndicator.label }}</span>
                        </div>

                        <UButton
                            v-if="siteBuildStatusAvailable && siteBuild?.canCancel"
                            :label="collapsed ? undefined : 'Cancel Build'"
                            aria-label="Cancel Build"
                            title="Cancel Build"
                            icon="mingcute:stop-circle-fill"
                            :loading="siteBuildCanceling"
                            :disabled="siteBuildLoading"
                            color="error"
                            variant="soft"
                            block
                            @click="cancelBuildModalOpen = true"
                        />
                    </div>

                    <AdminNavSection
                        title="Blogs"
                        icon="mingcute:book-3-fill"
                        :collapsed="sidebarCollapsed"
                    >
                        <UScrollArea class="modern-scrollbar max-h-42">
                            <AdminNav
                                :links="[
                                    {
                                        to: '/posts/new',
                                        icon: 'mingcute:add-line',
                                        label: 'New Post',
                                    },
                                    ...(posts?.map((post) => ({
                                        to: `/posts/${post.slug}`,
                                        label: post.title,
                                        updatedAt: post.updatedAt,
                                        slot: 'post',
                                    })) || []),
                                ]"
                                :collapsed
                            >
                                <template #post-trailing="{ item: { updatedAt } }">
                                    <NuxtTime
                                        :datetime="updatedAt"
                                        relative
                                        relative-style="narrow"
                                        locale="en"
                                        class="font-mono text-xs font-light text-nowrap"
                                    />
                                </template>
                            </AdminNav>
                        </UScrollArea>
                    </AdminNavSection>

                    <AdminNavSection
                        title="Users"
                        icon="mingcute:user-2-fill"
                        :collapsed="sidebarCollapsed"
                    >
                        <AdminNav
                            :links="
                                users?.users.map((user) => ({
                                    avatar: {
                                        src: user.image || undefined,
                                        alt: '',
                                    },
                                    label: user.name,
                                }))
                            "
                            :collapsed
                        />
                    </AdminNavSection>

                    <AdminNav
                        :links="[
                            {
                                to: app.repo,
                                target: '_blank',
                                external: true,
                                icon: 'mingcute:github-fill',
                                label: 'GitHub',
                            },
                            {
                                to: 'https://liry24.com',
                                label: 'Back to site',
                                icon: 'mingcute:arrow-left-line',
                                target: '_blank',
                                external: true,
                            },
                        ]"
                        :collapsed
                        class="mt-auto"
                    />
                </template>

                <template #footer="{ collapsed }">
                    <UDropdownMenu
                        :content="{
                            align: 'start',
                            side: 'right',
                        }"
                        :items="[
                            {
                                to: '/settings',
                                label: 'Settings',
                                icon: 'mingcute:settings-1-fill',
                            },
                            {
                                label: 'Logout',
                                icon: 'mingcute:exit-fill',
                                onClick: () => signOut(),
                            },
                        ]"
                    >
                        <button
                            type="button"
                            class="hover:bg-muted w-full cursor-pointer rounded-lg p-2"
                        >
                            <UAvatar
                                v-if="collapsed"
                                :src="session?.user.image || undefined"
                                :alt="session?.user.name || undefined"
                                icon="mingcute:user-3-fill"
                                size="sm"
                            />
                            <UUser
                                v-else
                                :name="session?.user.name || undefined"
                                :description="session?.user.email || undefined"
                                :avatar="{
                                    src: session?.user.image || undefined,
                                    alt: session?.user.name || undefined,
                                    icon: 'mingcute:user-3-fill',
                                }"
                                size="sm"
                                class="text-left"
                            />
                        </button>
                    </UDropdownMenu>
                </template>
            </UDashboardSidebar>

            <main class="min-h-dvh w-full overflow-auto">
                <slot />
            </main>
        </UDashboardGroup>

        <UModal v-model:open="cancelBuildModalOpen" title="Cancel build">
            <template #body>
                <UAlert
                    icon="mingcute:alert-fill"
                    title="Stop the current site build?"
                    :description="cancelBuildDescription"
                    color="error"
                    variant="subtle"
                />
            </template>

            <template #footer>
                <div class="flex w-full justify-end gap-2">
                    <UButton
                        label="Keep Building"
                        variant="ghost"
                        :disabled="siteBuildCanceling"
                        @click="cancelBuildModalOpen = false"
                    />
                    <UButton
                        label="Cancel Build"
                        color="error"
                        :loading="siteBuildCanceling"
                        @click="cancelBuild"
                    />
                </div>
            </template>
        </UModal>
    </div>
</template>

<style scoped>
.modern-scrollbar {
    scrollbar-color: color-mix(in oklab, var(--ui-bg-inverted) 70%, transparent) var(--ui-bg);
    scrollbar-width: thin;
}
</style>
