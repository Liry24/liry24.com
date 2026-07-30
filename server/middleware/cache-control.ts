import type { PublicCacheTag } from '../utils/cache'

const browserCacheControl = 'no-store'
const edgeCacheControl = 'public, max-age=300, stale-while-revalidate=86400, stale-if-error=86400'

const getPublicCacheTags = (pathname: string): PublicCacheTag[] => {
    if (pathname === '/') return ['home']
    if (pathname === '/works') return ['works']
    if (pathname === '/arts') return ['arts']
    if (pathname === '/posts' || pathname.startsWith('/posts/')) return ['posts']

    if (pathname === '/api/home') return ['home']
    if (/^\/api\/(socials|careers|skills|ranks)$/.test(pathname)) return ['home']
    if (pathname === '/api/works') return ['home', 'works']
    if (pathname === '/api/arts') return ['home', 'arts']
    if (pathname === '/api/posts') return ['home', 'posts']
    if (pathname.startsWith('/api/posts/')) return ['posts']
    if (pathname === '/api/__sitemap__/urls') return ['posts']
    if (pathname === '/sitemap_index.xml' || /^\/[^/]+-sitemap\.xml$/.test(pathname))
        return ['posts']

    return []
}

export default eventHandler((event) => {
    setResponseHeaders(event, {
        'Cache-Control': browserCacheControl,
        'Cloudflare-CDN-Cache-Control': 'no-store',
    })

    if (event.method !== 'GET' && event.method !== 'HEAD') return

    const tags = getPublicCacheTags(getRequestURL(event).pathname)
    if (tags.length === 0) return

    setResponseHeaders(event, {
        'Cache-Control': browserCacheControl,
        'Cloudflare-CDN-Cache-Control': edgeCacheControl,
        'Cache-Tag': tags.join(','),
    })
})
