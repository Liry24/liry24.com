<script setup lang="ts">
const { data } = useFetch('/api/arts')

defineSeo({
    title: 'Arts',
    titleTemplate: '%s | Liry24',
})
</script>

<template>
    <div v-if="data" class="grid gap-8">
        <MasonryWall
            :items="data"
            :column-width="240"
            :gap="24"
            :min-columns="1"
            :max-columns="3"
            :ssr-columns="2"
        >
            <template #default="{ item }">
                <UModal
                    scrollable
                    :title="item.title"
                    :ui="{
                        content:
                            'max-w-full h-[calc(100dvh-4rem)] w-[calc(100dvw-4rem)] rounded-2xl',
                    }"
                >
                    <div class="group relative cursor-pointer overflow-clip rounded-xl">
                        <NuxtImg
                            :src="item.images[0]?.src"
                            :alt="item.title"
                            :width="520"
                            class="size-full"
                        />

                        <div
                            class="absolute inset-0 flex flex-col gap-3 bg-black/50 p-4 text-zinc-100 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                            <span class="font-[Special_Gothic_Expanded_One] text-3xl font-bold">
                                {{ item.title }}
                            </span>

                            <div class="mt-auto ml-auto flex items-center gap-1">
                                <Icon name="mingcute:photo-album-fill" size="20" />
                                <span class="font-bold">{{ item.images.length }}</span>
                            </div>
                        </div>
                    </div>

                    <template #content>
                        <div class="grid grid-cols-3 gap-12 p-16">
                            <div class="col-span-2 flex flex-col gap-4">
                                <ArtCarousel :data="item.images" />

                                <UButton
                                    icon="mingcute:arrow-left-line"
                                    label="Back"
                                    variant="ghost"
                                    class="mt-auto w-fit"
                                />
                            </div>

                            <div class="flex flex-col gap-4">
                                <h1 class="text-4xl font-bold">{{ item.title }}</h1>
                                <p>{{ item.description }}</p>
                            </div>
                        </div>
                    </template>
                </UModal>
            </template>
        </MasonryWall>
    </div>
</template>
