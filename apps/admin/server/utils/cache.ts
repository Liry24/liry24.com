export const revalidateISR = async () => {
    const runtimeConfig = useRuntimeConfig()
    const token = runtimeConfig.bypassToken as string | undefined

    if (!import.meta.dev && token) {
        await $fetch(runtimeConfig.public.homeDomain, {
            headers: {
                'x-prerender-revalidate': token,
            },
        })
    }
}

export const purgeRuntimeCache = async () => {
    const runtimeConfig = useRuntimeConfig()

    if (!import.meta.dev)
        await $fetch(`${runtimeConfig.public.homeDomain}/api/purge-cache`, {
            method: 'POST',
            body: {
                token: runtimeConfig.bypassToken,
            },
        })
}
