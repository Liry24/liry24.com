export default defineNuxtRouteMiddleware(async (to) => {
    const { getSession } = useAuth()
    const session = await getSession()

    if (!session.value || session.value.user.role !== 'admin') {
        if (to.fullPath !== '/admin/login') return navigateTo('/admin/login')
    } else {
        if (to.fullPath === '/admin/login') return navigateTo('/admin')
    }

    to.meta.pageTransition = false
})
