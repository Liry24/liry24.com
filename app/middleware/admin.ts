export default defineNuxtRouteMiddleware(async () => {
    const { getSession } = useAuth()
    const session = await getSession()

    if (!session.value || session.value.user.role !== 'admin')
        showError({
            statusCode: 404,
            statusMessage: 'Not Found',
        })
})
