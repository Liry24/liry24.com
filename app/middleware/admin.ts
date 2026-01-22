export default defineNuxtRouteMiddleware(async () => {
    const { getSession } = useAuth()
    const session = await getSession()

    if (!session.value || session.value.user.role !== 'admin')
        return await navigateTo('/admin/login')
})
