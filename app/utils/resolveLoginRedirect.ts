export const DEFAULT_LOGIN_REDIRECT = '/admin'

export const resolveLoginRedirect = (redirect: unknown): string => {
    if (typeof redirect !== 'string' || !redirect.startsWith('/')) {
        return DEFAULT_LOGIN_REDIRECT
    }

    try {
        const url = new URL(redirect, 'https://liry24.com')
        return url.origin === 'https://liry24.com' ? redirect : DEFAULT_LOGIN_REDIRECT
    } catch {
        return DEFAULT_LOGIN_REDIRECT
    }
}
