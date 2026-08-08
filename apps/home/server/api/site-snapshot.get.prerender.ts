import type { PublicSiteSnapshot } from '@repo/database/types'

export default defineEventHandler(async () => {
    const snapshotURL = process.env.SITE_SNAPSHOT_URL || 'https://admin.liry24.com/api/site-snapshot'
    const apiKey = process.env.ADMIN_API_KEY

    if (!snapshotURL || !apiKey)
        throw createError({
            statusCode: 500,
            statusMessage: 'Site snapshot build settings are missing',
        })

    const response = await fetch(snapshotURL, {
        headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (!response.ok)
        throw createError({ statusCode: 502, statusMessage: 'Could not fetch the site snapshot' })

    return (await response.json()) as PublicSiteSnapshot
})
