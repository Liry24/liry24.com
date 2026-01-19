<script setup lang="ts">
const route = useRoute()

const { data } = await useFetch(`/api/posts/${route.params.slug}`)

defineSeo({
    title: data.value?.title,
    titleTemplate: '%s | Liry24',
})
</script>

<template>
    <UPage v-if="data" :ui="{ center: 'flex flex-col gap-6 items-center' }">
        <UContainer class="flex max-w-4xl flex-col items-center gap-6">
            <h1
                :initial="{ opacity: 0 }"
                :animate="{ opacity: 1 }"
                class="text-center text-4xl font-bold"
            >
                {{ data.title }}
            </h1>

            <div class="flex items-center gap-2">
                <NuxtTime
                    :datetime="data.createdAt"
                    date-style="short"
                    time-style="short"
                    class="text-muted text-sm"
                />
                <UBadge
                    v-for="(tag, index) in data.tags"
                    :key="`tag-${index}`"
                    :label="tag.tag"
                    icon="mingcute:hashtag-line"
                    variant="soft"
                />
            </div>

            <div class="flex max-w-4xl flex-col gap-6">
                <USeparator class="my-4" />

                <MDC :value="data.content" class="sentence px-1 *:first:mt-0 *:last:mb-0" />
            </div>
        </UContainer>
    </UPage>
</template>
