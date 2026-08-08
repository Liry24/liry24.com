const encode = new TextEncoder()

const hasMatchingApiKey = async (provided: string, expected: string) => {
    const [providedHash, expectedHash] = await Promise.all([
        crypto.subtle.digest('SHA-256', encode.encode(provided)),
        crypto.subtle.digest('SHA-256', encode.encode(expected)),
    ])

    return (
        crypto.subtle as SubtleCrypto & {
            timingSafeEqual(a: ArrayBuffer, b: ArrayBuffer): boolean
        }
    ).timingSafeEqual(providedHash, expectedHash)
}

export default defineEventHandler(async (event) => {
    const authorization = getHeader(event, 'authorization')
    const providedApiKey = authorization?.startsWith('Bearer ') ? authorization.slice(7) : ''
    const expectedApiKey =
        getCloudflareEnvironment<{ ADMIN_API_KEY?: string }>(event).ADMIN_API_KEY ??
        process.env.ADMIN_API_KEY

    if (!expectedApiKey || !(await hasMatchingApiKey(providedApiKey, expectedApiKey)))
        throw createError({ status: 403, statusText: 'Forbidden' })

    return getPublicSiteSnapshot(useDB())
})
