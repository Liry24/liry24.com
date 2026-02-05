<script lang="ts" setup>
const { app } = useAppConfig()
const { session, signOut } = useAuth()

const { data: users } = useFetch('/api/users')
const { data: posts } = useFetch('/api/posts', { key: 'posts' })

const sidebarCollapsed = ref(false)
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
                                collapsed && 'mt-8 mb-8 flex-col pl-0'
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
                                to: app.vercel,
                                target: '_blank',
                                external: true,
                                icon: 'mingcute:triangle-fill',
                                label: 'Vercel',
                            },
                            {
                                to: app.turso,
                                target: '_blank',
                                external: true,
                                icon: 'mingcute:coin-2-fill',
                                label: 'Turso',
                            },
                            {
                                to: app.tigris,
                                target: '_blank',
                                external: true,
                                icon: 'mingcute:storage-fill',
                                label: 'Tigris',
                            },
                            {
                                to: '/',
                                label: 'Back to site',
                                icon: 'lucide:arrow-left',
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
                                icon="lucide:user-round"
                                size="sm"
                            />
                            <UUser
                                v-else
                                :name="session?.user.name || undefined"
                                :description="session?.user.email || undefined"
                                :avatar="{
                                    src: session?.user.image || undefined,
                                    alt: session?.user.name || undefined,
                                    icon: 'lucide:user-round',
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
    </div>
</template>

<style scoped>
.modern-scrollbar {
    scrollbar-color: color-mix(in oklab, var(--ui-bg-inverted) 70%, transparent) var(--ui-bg);
    scrollbar-width: thin;
}
</style>
