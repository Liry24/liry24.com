export const revalidateISR = async () => {
    const runtimeConfig = useRuntimeConfig()

    await $fetch(runtimeConfig.public.homeDomain, {
        headers: {
            'x-prerender-revalidate': runtimeConfig.bypassToken,
        },
    })
}

export const purgeRuntimeCache = async () => {
    const runtimeConfig = useRuntimeConfig()
    await $fetch(`${runtimeConfig.public.homeDomain}/api/purge-cache`, {
        method: 'POST',
        body: {
            token: runtimeConfig.bypassToken,
        },
    })
}
