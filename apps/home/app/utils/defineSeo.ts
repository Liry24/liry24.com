type OgImageInput = {
    component: string
    props?: Record<string, unknown>
    options?: Record<string, unknown> | Record<string, unknown>[]
}

type DefineOgImageFn = (
    component: string,
    props?: Record<string, unknown>,
    options?: Record<string, unknown> | Record<string, unknown>[],
) => void

export default ({
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
    image?: OgImageInput
    type?: 'website' | 'article'
    twitterCard?: 'summary' | 'summary_large_image'
}) => {
    useSeoMeta({
        title: title,
        ogTitle: title,
        titleTemplate: titleTemplate,
        description: description,
        ogDescription: description,
        twitterTitle: title,
        twitterDescription: description,
        twitterCard: twitterCard || 'summary_large_image',
    })
    useHead({
        meta: [{ property: 'og:type', content: type || 'article' }],
        link: [{ rel: 'icon', href: '/favicon.ico' }],
    })
    if (image) {
        const maybeFn = (globalThis as Record<string, unknown>).defineOgImage
        if (typeof maybeFn === 'function') {
            ;(maybeFn as DefineOgImageFn)(image.component, image.props, image.options)
        }
    }
}
