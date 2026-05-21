export default adminSessionEventHandler(async () => {
    const { headers } = useEvent()

    const data = await auth.api.listUsers({
        query: {
            limit: 4,
        },
        headers,
    })

    return data
})
