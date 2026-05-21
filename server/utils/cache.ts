export const purgeRuntimeCache = async () => {
    const runtimeConfig = useRuntimeConfig()

    if (!import.meta.dev)
        await $fetch('/api/purge-cache', {
            method: 'POST',
            body: {
                token: runtimeConfig.bypassToken,
            },
        })
}
