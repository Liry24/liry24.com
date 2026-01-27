export default defineNuxtRouteMiddleware(async (to) => {
    const { getSession } = useAuth()
    const session = await getSession()

    if (!session.value || session.value.user.role !== 'admin') {
        if (to.fullPath !== '/login') return navigateTo('/login')
    } else {
        if (to.fullPath === '/login') return navigateTo('/')
    }

    to.meta.pageTransition = false
})
