<script setup lang="ts">
import { UPageCard } from '#components'
import { motion } from 'motion-v'

const { data } = useFetch('/api/posts')
</script>

<template>
    <UPage v-if="data">
        <div class="mx-4 grid grid-cols-2 gap-6">
            <motion.div
                v-for="(post, index) in data"
                :key="post.slug"
                :initial="{
                    opacity: 0,
                    filter: 'blur(20px)',
                }"
                :animate="{
                    opacity: 1,
                    filter: 'blur(0px)',
                }"
                :transition="{
                    delay: 0.2 + index * 0.1,
                }"
            >
                <UPageCard :to="`/posts/${post.slug}`" variant="ghost" class="flex flex-col gap-2">
                    <h2
                        class="before:text-dimmed text-2xl font-bold before:font-mono before:-tracking-widest before:content-['//_']"
                    >
                        {{ post.title }}
                    </h2>

                    <div class="flex items-center gap-2">
                        <NuxtTime
                            :datetime="post.createdAt"
                            date-style="short"
                            time-style="short"
                            class="text-muted font-mono text-sm"
                        />
                        <UBadge
                            v-for="(tag, tagIndex) in post.tags"
                            :key="`tag-${tagIndex}`"
                            :label="tag.tag"
                            icon="mingcute:hashtag-line"
                            variant="soft"
                        />
                    </div>
                </UPageCard>
            </motion.div>
        </div>
    </UPage>
</template>
