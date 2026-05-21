// Load the reflect polyfill before importing Better Auth's passkey stack in Workers.
export const getAuth = async () => {
    await import('reflect-metadata')
    const { auth } = await import('./auth')

    return auth
}
