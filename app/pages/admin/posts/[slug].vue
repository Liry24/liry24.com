<script setup lang="ts">
import type { Schema } from '~/components/admin/postForm.vue'

type Review = {
    id: string
    createdAt: string | Date
    status: 'completed' | 'failed'
    model: string
    issues: Array<{ severity: 'low' | 'medium' | 'high'; message: string }>
    sourceContent: string | null
    summary: string | null
    suggestedContent: string | null
    notes: string | null
    error: string | null
}

type ReviewResult = {
    job: { status: 'pending' | 'running' | 'completed' | 'failed' }
    review: Review | null
}

type PostDetail = {
    slug: string
    title: string
    excerpt: string
    content: string
    status: 'draft' | 'scheduled' | 'published'
    scheduledAt: string | Date | null
    tags: Array<{ tag: string }>
    reviews: Review[]
}

type DiffLine = { kind: 'same' | 'removed' | 'added'; value: string }

const route = useRoute()
const { updatePost, deletePost, publishPost, reviewPost, submitting } = usePost()
const toast = useToast()
const { data, refresh } = await useFetch<PostDetail>(`/api/admin/posts/${route.params.slug}`)

if (!data.value) navigateTo('/')

const toLocalDateTime = (value: string | Date | null | undefined) => {
    if (!value) return undefined
    const date = new Date(value)
    const offset = date.getTimezoneOffset() * 60_000
    return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

const state = reactive<Schema>({
    slug: data.value!.slug,
    title: data.value!.title,
    excerpt: data.value!.excerpt,
    tags: data.value!.tags.map((tag) => tag.tag),
    content: data.value!.content,
    status: data.value!.status === 'scheduled' ? 'scheduled' : 'draft',
    scheduledAt: toLocalDateTime(data.value!.scheduledAt),
})

const openModalDelete = ref(false)
const reviewModalOpen = ref(false)
const reviewLoading = ref(false)
const activeReview = ref<ReviewResult | null>(null)
let reviewPoll: number | undefined

const stopReviewPolling = () => {
    if (reviewPoll) window.clearTimeout(reviewPoll)
    reviewPoll = undefined
}

const refreshReview = async (jobId: string) => {
    try {
        const result = await $fetch<ReviewResult>(`/api/admin/posts/${route.params.slug}/reviews/${jobId}`)
        activeReview.value = result
        reviewLoading.value = result.job.status === 'pending' || result.job.status === 'running'
        if (reviewLoading.value) reviewPoll = window.setTimeout(() => void refreshReview(jobId), 1_000)
        else await refresh()
    } catch (error) {
        stopReviewPolling()
        reviewLoading.value = false
        console.error(error)
        toast.add({ title: 'Could not retrieve the review', color: 'error' })
    }
}

const onSubmit = async () => {
    try {
        await updatePost(route.params.slug as string, state)
        await refresh()
    } catch {
        // Error handled in composable
    }
}

const onPublish = async () => {
    await publishPost(route.params.slug as string)
    await refresh()
}

const onReview = async () => {
    try {
        stopReviewPolling()
        reviewModalOpen.value = true
        reviewLoading.value = true
        activeReview.value = null
        const jobId = await reviewPost(route.params.slug as string, {
            title: state.title,
            excerpt: state.excerpt,
            content: state.content,
        })
        await refreshReview(jobId)
    } catch {
        reviewLoading.value = false
        reviewModalOpen.value = false
    }
}

const onDelete = async () => {
    try {
        await deletePost(route.params.slug as string)
        openModalDelete.value = false
        navigateTo('/admin')
    } catch {
        // Error handled in composable
    }
}

const diffLines = computed<DiffLine[]>(() => {
    const review = activeReview.value?.review
    if (!review?.sourceContent || !review.suggestedContent) return []
    const before = review.sourceContent.split('\n')
    const after = review.suggestedContent.split('\n')
    let start = 0
    while (start < before.length && start < after.length && before[start] === after[start]) start += 1
    let beforeEnd = before.length - 1
    let afterEnd = after.length - 1
    while (beforeEnd >= start && afterEnd >= start && before[beforeEnd] === after[afterEnd]) {
        beforeEnd -= 1
        afterEnd -= 1
    }
    return [
        ...before.slice(0, start).map((value) => ({ kind: 'same' as const, value })),
        ...before.slice(start, beforeEnd + 1).map((value) => ({ kind: 'removed' as const, value })),
        ...after.slice(start, afterEnd + 1).map((value) => ({ kind: 'added' as const, value })),
        ...before.slice(beforeEnd + 1).map((value) => ({ kind: 'same' as const, value })),
    ]
})

const reviewIsCurrent = computed(
    () => activeReview.value?.review?.sourceContent === state.content,
)

const acceptReview = () => {
    const suggestion = activeReview.value?.review?.suggestedContent
    if (!suggestion || !reviewIsCurrent.value) return
    state.content = suggestion
    reviewModalOpen.value = false
    toast.add({
        title: 'Suggestion applied',
        description: 'Review changes are now in the editor. Save when you are ready.',
        color: 'success',
    })
}

const openHistoricReview = (review: Review) => {
    activeReview.value = { job: { status: review.status }, review }
    reviewLoading.value = false
    reviewModalOpen.value = true
}

watch(reviewModalOpen, (open) => {
    if (!open) stopReviewPolling()
})
onBeforeUnmount(stopReviewPolling)
</script>

<template>
    <div class="px-6">
        <UDashboardPanel resizable>
            <template #header>
                <UDashboardNavbar title="Edit Post" icon="mingcute:edit-3-fill">
                    <template #trailing>
                        <span class="text-muted ml-2 font-mono text-sm">{{ data?.slug }}</span>
                    </template>

                    <template #right>
                        <UModal v-model:open="openModalDelete" title="Are you sure you want to delete this post?">
                            <UButton icon="mingcute:delete-2-fill" label="Delete" variant="outline" color="neutral" />
                            <template #body>
                                <UAlert icon="mingcute:delete-2-fill" title="This action cannot be undone." color="error" variant="outline" />
                            </template>
                            <template #footer>
                                <UButton label="Delete" color="neutral" loading-auto class="ml-auto" @click="onDelete" />
                            </template>
                        </UModal>

                        <UButton icon="mingcute:ai-fill" label="Review" variant="outline" color="neutral" :loading="submitting" @click="onReview" />
                        <UButton v-if="data?.status !== 'published'" icon="mingcute:send-fill" label="Publish" variant="outline" color="neutral" :loading="submitting" @click="onPublish" />
                        <UButton v-if="data?.status !== 'published'" icon="mingcute:save-2-fill" label="Save" color="neutral" loading-auto @click="onSubmit" />
                    </template>
                </UDashboardNavbar>
            </template>

            <template #body>
                <UScrollArea class="h-[calc(100dvh-var(--ui-header-height))] p-6">
                    <AdminPostForm v-model="state" :disabled="data?.status === 'published'" :fields="{ slug: false }" @submit="onSubmit" />

                    <section v-if="data?.reviews?.length" class="mt-8 grid gap-3">
                        <h2 class="text-lg font-semibold">Editorial reviews</h2>
                        <UButton
                            v-for="review in data.reviews"
                            :key="review.id"
                            :label="`${review.status} · ${new Date(review.createdAt).toLocaleString()}`"
                            variant="outline"
                            color="neutral"
                            class="justify-start"
                            @click="openHistoricReview(review)"
                        />
                    </section>
                </UScrollArea>
            </template>
        </UDashboardPanel>

        <UModal v-model:open="reviewModalOpen" title="AI editorial review" :dismissible="!reviewLoading">
            <template #body>
                <div v-if="reviewLoading" class="flex items-center gap-3 py-8">
                    <UIcon name="mingcute:loading-fill" class="animate-spin" />
                    <p>Reviewing the current editor content…</p>
                </div>
                <div v-else-if="activeReview?.review" class="grid gap-6">
                    <section class="grid gap-2">
                        <h2 class="font-semibold">Current-content comments</h2>
                        <p v-if="activeReview.review.summary" class="text-sm">{{ activeReview.review.summary }}</p>
                        <ul v-if="activeReview.review.issues.length" class="grid gap-2 text-sm">
                            <li v-for="issue in activeReview.review.issues" :key="issue.message">
                                <UBadge :label="issue.severity" :color="issue.severity === 'high' ? 'error' : issue.severity === 'medium' ? 'warning' : 'info'" size="xs" />
                                <span class="ml-2">{{ issue.message }}</span>
                            </li>
                        </ul>
                        <p v-else>No issues were detected.</p>
                    </section>

                    <section class="grid gap-2">
                        <h2 class="font-semibold">Proposed diff</h2>
                        <p v-if="!activeReview.review.suggestedContent" class="text-muted text-sm">No text changes were proposed.</p>
                        <pre v-else class="bg-muted max-h-72 overflow-auto rounded p-3 text-xs"><code v-for="(line, index) in diffLines" :key="index" :class="line.kind === 'added' ? 'text-success' : line.kind === 'removed' ? 'text-error line-through' : ''" class="block whitespace-pre-wrap">{{ line.kind === 'added' ? '+ ' : line.kind === 'removed' ? '- ' : '  ' }}{{ line.value }}</code></pre>
                    </section>

                    <section class="grid gap-2">
                        <h2 class="font-semibold">Review notes</h2>
                        <p class="text-sm">{{ activeReview.review.notes || 'No supplemental notes.' }}</p>
                    </section>

                    <UAlert v-if="activeReview.review.error" color="error" :title="activeReview.review.error" />
                    <UAlert v-else-if="!reviewIsCurrent" color="warning" title="The editor has changed since this review. Run a new review before applying it." />
                </div>
                <UAlert v-else color="error" title="The review did not return a result." />
            </template>
            <template #footer>
                <UButton label="Reject" color="neutral" variant="outline" @click="reviewModalOpen = false" />
                <UButton label="Accept changes" class="ml-auto" :disabled="!activeReview?.review?.suggestedContent || !reviewIsCurrent" @click="acceptReview" />
            </template>
        </UModal>
    </div>
</template>
