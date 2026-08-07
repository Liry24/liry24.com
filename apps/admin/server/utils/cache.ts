export type PublicCacheTag = 'home' | 'works' | 'arts' | 'posts'

interface CachePurgeResult {
    success: boolean
    errors?: unknown[]
}

interface WorkersCacheController {
    purge(options: { tags: string[] }): Promise<CachePurgeResult>
}

export const getAdminMutationCacheTags = (pathname: string): PublicCacheTag[] => {
    const resource = pathname.split('/').filter(Boolean)[2]

    switch (resource) {
        case 'socials':
        case 'careers':
        case 'skills':
        case 'ranks':
            return ['home']
        case 'works':
            return ['home', 'works']
        case 'arts':
            return ['home', 'arts']
        case 'posts':
            return ['home', 'posts']
        default:
            return []
    }
}

export const purgePublicCache = async (tags: readonly PublicCacheTag[]) => {
    if (import.meta.dev || tags.length === 0) return

    const context = useEvent().context.cloudflare.context as unknown as {
        cache?: WorkersCacheController
    }
    const cache = context.cache

    if (!cache) {
        console.error('Cloudflare cache purge API is unavailable', { tags })
        return
    }

    try {
        const result = await cache.purge({ tags: [...new Set(tags)] })

        if (!result.success)
            console.error('Cloudflare cache purge failed', {
                tags,
                errors: result.errors,
            })
    } catch (error) {
        console.error('Cloudflare cache purge threw an error', { tags, error })
    }
}
