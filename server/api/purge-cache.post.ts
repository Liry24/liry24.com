export default eventHandler(async (event) => {
    const runtimeConfig = useRuntimeConfig()
    const body = await readBody(event)

    if (body.token !== runtimeConfig.bypassToken)
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        })

    await useStorage('cache').remove('nitro:functions:getSocials:default.json')

    return {
        success: true,
    }
})
