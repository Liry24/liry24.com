import { addCacheTag, invalidateByTag } from '@vercel/functions'

export const defineCDNCache = async (cacheAge: number, tag: string) => {
    await addCacheTag(tag)
    setResponseHeader(useEvent(), 'CDN-Cache-Control', `max-age=${cacheAge}`)
}

export const purgeVercelCDNCacheByTags = async (tags: string | string[]) =>
    await invalidateByTag(tags)
