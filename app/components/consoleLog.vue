<script setup lang="ts">
interface Props {
    logs: ConsoleLog[]
    autoScroll?: boolean
}
const props = withDefaults(defineProps<Props>(), {
    autoScroll: true,
})

const scrollContainer = ref<HTMLElement | null>(null)
const bottomSentinel = ref<HTMLElement | null>(null)
const isAtBottom = ref(true)

let observer: IntersectionObserver | null = null

onMounted(() => {
    observer = new IntersectionObserver(
        ([entry]) => {
            isAtBottom.value = entry?.isIntersecting ?? true
        },
        { threshold: 0.1 }
    )

    if (bottomSentinel.value) observer.observe(bottomSentinel.value)
})

watch(
    () => props.logs,
    async () => {
        if (isAtBottom.value && props.autoScroll) {
            await nextTick()
            if (scrollContainer.value)
                scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
        }
    },
    { deep: true }
)

const scrollToBottom = () => {
    scrollContainer.value?.scrollTo({
        top: scrollContainer.value.scrollHeight,
        behavior: 'smooth',
    })
}
</script>

<template>
    <div class="group bg-muted relative overflow-hidden rounded-2xl p-1">
        <div
            ref="scrollContainer"
            class="scrollbar-thin h-full overflow-y-auto px-2 font-mono text-sm leading-relaxed"
        >
            <div
                v-for="(log, index) in logs"
                :key="index"
                class="hover:bg-accented flex items-center gap-4 rounded-md px-2 transition-colors"
            >
                <NuxtTime
                    :datetime="log.createdAt"
                    time-style="medium"
                    class="text-muted text-xs select-none"
                />
                <span class="break-all whitespace-pre-wrap">{{ log.message }}</span>
            </div>

            <div ref="bottomSentinel" class="h-px w-px"></div>
        </div>

        <UButton
            v-if="!isAtBottom && props.autoScroll"
            icon="lucide:arrow-down"
            label="Latest"
            color="neutral"
            class="absolute right-4 bottom-4 rounded-full px-4"
            @click="scrollToBottom"
        />
    </div>
</template>

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
    width: 6px;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: oklch(50% 0 0);
    border-radius: 10px;
}
.scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
}
</style>
