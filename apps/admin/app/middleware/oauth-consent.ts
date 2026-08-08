export default defineNuxtRouteMiddleware(async (to) => {
    const { session } = await useAuth()
    if (!session.value)
        return navigateTo({
            path: '/login',
            query: { redirect: to.fullPath },
        })
    if (session.value.user.role !== 'admin') return navigateTo('/')
    if (typeof to.query.client_id !== 'string') return navigateTo('/')
})
