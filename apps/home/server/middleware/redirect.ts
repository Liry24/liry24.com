import type { D1Database } from '@cloudflare/workers-types'

export default defineEventHandler(async (event) => {
    if (event.method !== 'GET' && event.method !== 'HEAD') return

    let path = getRequestURL(event).pathname.slice(1)

    if (path.endsWith('/')) path = path.slice(0, -1)
    if (!path || path.includes('/')) return
    if (path.includes('.')) return
    if (['arts', 'posts', 'works'].includes(path)) return

    const database = getCloudflareEnvironment<{ DB?: D1Database }>(event)?.DB
    if (!database) return

    const social = await database
        .prepare('SELECT href FROM socials WHERE alias = ? LIMIT 1')
        .bind(path)
        .first<{ href: string }>()

    if (social?.href) return sendRedirect(event, social.href)
})
