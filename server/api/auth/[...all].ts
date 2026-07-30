export default eventHandler(async (event) => {
    try {
        const auth = await getAuth()
        return await auth.handler(toWebRequest(event))
    } catch (error) {
        console.error('Better Auth request failed', {
            path: getRequestURL(event).pathname,
            error:
                error instanceof Error
                    ? {
                          name: error.name,
                          message: error.message,
                      }
                    : String(error),
        })
        throw error
    }
})
