export default defineNuxtRouteMiddleware(async () => {
    const { getSession } = useAuth()
    const session = await getSession()

    if (!session.value || session.value.user.role !== 'admin') navigateTo('/admin/login')
})
