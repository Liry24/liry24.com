import type { PublicSiteSnapshot } from '@repo/database/types'

export default defineEventHandler(async () => {
    const snapshot = await $fetch<PublicSiteSnapshot>('/api/site-snapshot')

    return snapshot.posts.map((post) => ({
        loc: `/posts/${post.slug}`,
        lastmod: post.updatedAt,
    }))
})
