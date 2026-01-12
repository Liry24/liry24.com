<script setup lang="ts">
import { NuxtLink } from '#components'
import { motion } from 'motion-v'

const route = useRoute()

const MotionNuxtLink = motion.create(NuxtLink)

const tabs = [
    {
        label: 'arts',
        to: '/arts',
    },
    // {
    //     label: 'works',
    //     to: '/works',
    // },
    {
        label: 'posts',
        to: '/posts',
    },
]

const title = computed(() => tabs.find((tab) => route.path.startsWith(tab.to))?.label || 'Liry24')
</script>

<template>
    <MotionConfig :transition="{ duration: 0.6 }" reduced-motion="user">
        <div class="flex min-h-dvh flex-col">
            <div class="mx-8 my-12 flex grow flex-col gap-12 md:mx-12 lg:mx-24 lg:mt-24">
                <motion.header
                    :initial="{ opacity: 0 }"
                    :animate="{ opacity: 1 }"
                    class="flex w-full flex-col items-center gap-3"
                >
                    <MotionNuxtLink to="/" class="flex items-center gap-3">
                        <NuxtImg
                            v-if="route.path === '/'"
                            src="/avatar.png"
                            alt=""
                            class="size-14 rounded-full"
                        />
                        <HyperText
                            :text="title"
                            :duration="500"
                            as="h1"
                            :class="
                                cn(
                                    'font-[Special_Gothic_Expanded_One] text-6xl leading-none tracking-tight',
                                    route.path === '/' && 'w-56'
                                )
                            "
                        />
                    </MotionNuxtLink>

                    <div class="ml-1 flex items-center gap-2">
                        <UNavigationMenu
                            :items="tabs"
                            color="neutral"
                            variant="link"
                            orientation="horizontal"
                            class="text-toned ml-auto font-mono text-lg font-medium"
                        />

                        <ColorModeButton />
                    </div>
                </motion.header>

                <slot />
            </div>

            <motion.footer
                :initial="{ opacity: 0 }"
                :animate="{ opacity: 1 }"
                class="mx-8 mb-10 flex items-center gap-3 md:mx-12 lg:mx-24"
            >
                <p class="text-dimmed text-sm leading-none text-nowrap">2025 © Liry24</p>
            </motion.footer>
        </div>
    </MotionConfig>
</template>
