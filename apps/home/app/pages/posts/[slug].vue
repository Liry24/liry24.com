<script setup lang="ts">
const route = useRoute()

const { data } = await useFetch(`/api/posts/${route.params.slug}`)

const location = useBrowserLocation()

const { isSupported: isShareSupported, share } = useShare({
    title: data.value?.title,
    url: location.value.href,
})

const { isSupported: isCopySupported, copy, copied } = useClipboard()

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

            <div class="flex items-center gap-1">
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
                    class="ml-1"
                />
                <UButton
                    v-if="isShareSupported"
                    icon="mingcute:share-2-fill"
                    variant="ghost"
                    size="sm"
                    class="ml-1"
                    @click="share()"
                />
                <UButton
                    v-if="isCopySupported && location.href"
                    :icon="copied ? 'mingcute:check-fill' : 'mingcute:link-3-fill'"
                    :label="copied ? 'URL Copied' : undefined"
                    variant="ghost"
                    size="sm"
                    class="transition-all"
                    @click="copy(location.href)"
                />
            </div>

            <div class="flex max-w-4xl flex-col gap-6">
                <USeparator class="my-4" />

                <MDC :value="data.content" class="sentence px-1 *:first:mt-0 *:last:mb-0" />
            </div>
        </UContainer>
    </UPage>
</template>
