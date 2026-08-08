import type { PublicSiteSnapshot } from '@repo/database/types'

export const useSiteSnapshot = () =>
    useFetch<PublicSiteSnapshot>('/api/site-snapshot', {
        key: 'site-snapshot',
    })
