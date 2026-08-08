export default adminSessionEventHandler(async ({ event }) => {
    const deployHook = getCloudflareEnvironment<{ SITE_DEPLOY_HOOK_URL?: string }>(
        event,
    ).SITE_DEPLOY_HOOK_URL

    if (!deployHook)
        throw createError({ statusCode: 503, statusMessage: 'Site build hook is not configured' })

    const response = await fetch(deployHook, { method: 'POST' })

    if (!response.ok) {
        console.error(
            JSON.stringify({
                message: 'Site build hook rejected the request',
                status: response.status,
            }),
        )
        throw createError({ statusCode: 502, statusMessage: 'Could not start the site build' })
    }

    return { queued: true }
})
