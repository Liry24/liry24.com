export default eventHandler(async (event) => {
    const runtimeConfig = useRuntimeConfig()
    const body = await readBody(event)

    if (body.token !== runtimeConfig.bypassToken) throw serverError.unauthorized()

    await useStorage('cache').remove('nitro:functions:getSocials:default.json')

    return {
        success: true,
    }
})
