import { clsx, type ClassValue } from 'clsx'
import { useHead, useSeoMeta } from 'nuxt/app'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs))

export const defineSeo = (
    {
        title,
        titleTemplate,
        description,
        image,
        type,
        twitterCard,
    }: {
        title?: string
        titleTemplate?: string
        description?: string
        image?: string
        type?: 'website' | 'article'
        twitterCard?: 'summary' | 'summary_large_image'
    } = {
        type: 'article',
        twitterCard: 'summary',
    }
) => {
    useSeoMeta({
        title,
        titleTemplate,
        description,
        ogDescription: description,
        ogImage: image,
        twitterTitle: title,
        twitterDescription: description,
        twitterImage: image,
        twitterCard: twitterCard,
    })
    useHead({
        meta: [{ property: 'og:type', content: type }],
        link: [{ rel: 'icon', href: '/favicon.ico' }],
    })
}
