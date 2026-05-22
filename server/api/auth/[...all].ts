export default eventHandler(async (event) => {
    const auth = await getAuth()
    return auth.handler(toWebRequest(event))
})
