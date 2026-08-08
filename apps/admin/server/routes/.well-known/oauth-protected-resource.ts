export default eventHandler(async (event) => {
    const auth = await getAuth()
    return await auth.handler(toWebRequest(event))
})
