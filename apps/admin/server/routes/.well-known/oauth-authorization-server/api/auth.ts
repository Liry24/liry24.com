export default eventHandler(async (event) => {
    const request = toWebRequest(event)
    const auth = await getAuth()
    return await auth.handler(request)
})
