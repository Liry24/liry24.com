<script lang="ts" setup>
const { app } = useAppConfig()
const { session, signOut } = useAuth()

const { data: users } = useFetch('/api/admin/users')
const { data: posts } = useFetch('/api/posts', { key: 'posts' })
</script>

<template>
    <div class="bg-elevated/70 fixed inset-0">
        <UDashboardGroup unit="rem" class="bg-default m-1 rounded-lg">
            <UDashboardSidebar
                id="default"
                collapsible
                resizable
                :ui="{
                    root: 'min-h-[calc(100svh-0.5rem)]',
                    footer: 'lg:border-t lg:border-default p-1',
                }"
            >
                <template #header="{ collapsed }">
                    <div :data-collapsed="collapsed" class="flex items-center gap-2 pl-2">
                        <UButton
                            to="/admin"
                            icon="liria:liria"
                            label="Admin"
                            variant="link"
                            color="neutral"
                            size="sm"
                            class="text-highlighted gap-1.5 p-0 text-base font-extralight"
                        />
                    </div>
                </template>

                <template #default="{ collapsed }">
                    <AdminNav
                        :links="[
                            {
                                to: '/admin/persona',
                                icon: 'mingcute:sparkles-fill',
                                label: 'Persona',
                            },
                            {
                                to: '/admin/works',
                                icon: 'mingcute:package-2-fill',
                                label: 'Works',
                            },
                            {
                                to: '/admin/arts',
                                icon: 'mingcute:pic-fill',
                                label: 'Arts',
                            },
                            {
                                to: '/admin/careers',
                                icon: 'mingcute:suitcase-fill',
                                label: 'Careers',
                            },
                            {
                                to: '/admin/skills',
                                icon: 'mingcute:award-fill',
                                label: 'Skills',
                            },
                            {
                                to: '/admin/ranks',
                                icon: 'mingcute:chess-fill',
                                label: 'Ranks',
                            },
                        ]"
                        :collapsed
                    />

                    <AdminNavSection title="Blogs">
                        <UScrollArea class="modern-scrollbar max-h-42">
                            <AdminNav
                                :links="[
                                    {
                                        to: '/admin/posts/new',
                                        icon: 'mingcute:add-line',
                                        label: 'New Post',
                                    },
                                    ...(posts?.map((post) => ({
                                        to: `/admin/posts/${post.slug}`,
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

                    <AdminNavSection title="Users">
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
                                to: '/admin/settings',
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
