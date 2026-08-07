import { z } from 'zod'

export const MAX_ADMIN_UPLOAD_BYTES = 10 * 1024 * 1024

export const directUploadContentTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'image/svg+xml',
] as const

export const importedUploadContentTypes = directUploadContentTypes.filter(
    (contentType) => contentType !== 'image/svg+xml',
)

export const adminUploadRequestSchema = z.object({
    key: z.string().min(1).max(512),
    contentType: z.enum(directUploadContentTypes),
    size: z.number().int().positive().max(MAX_ADMIN_UPLOAD_BYTES),
})

export const normalizeAdminUploadKey = (value: string) => {
    const key = value.replaceAll('\\', '/').normalize('NFKC')
    if (key.startsWith('/') || key.endsWith('/') || key.includes('\0'))
        throw new Error('Invalid upload key')

    const segments = key.split('/')
    if (
        segments.some(
            (segment) =>
                !segment ||
                segment === '.' ||
                segment === '..' ||
                segment.startsWith('.') ||
                !/^[\p{L}\p{N}._-]+$/u.test(segment),
        )
    )
        throw new Error('Invalid upload key')

    return segments.join('/')
}

const isPrivateIPv4 = (hostname: string) => {
    const octets = hostname.split('.').map(Number)
    if (
        octets.length !== 4 ||
        octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
    )
        return false
    const [a, b] = octets as [number, number, number, number]
    return (
        a === 0 ||
        a === 10 ||
        a === 127 ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        a >= 224
    )
}

const isPrivateIPv6 = (hostname: string) => {
    const value = hostname.replace(/^\[|\]$/gu, '').toLowerCase()
    return (
        value === '::' ||
        value === '::1' ||
        value.startsWith('fc') ||
        value.startsWith('fd') ||
        /^fe[89ab]/u.test(value) ||
        value.startsWith('::ffff:127.') ||
        value.startsWith('::ffff:10.') ||
        value.startsWith('::ffff:192.168.') ||
        /^::ffff:172\.(1[6-9]|2\d|3[01])\./u.test(value)
    )
}

export const assertSafeImportUrl = (value: string) => {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || url.port)
        throw new Error('Import URL must be an HTTPS URL without credentials or a custom port')

    const hostname = url.hostname.toLowerCase().replace(/\.$/u, '')
    if (
        hostname === 'localhost' ||
        hostname.endsWith('.localhost') ||
        hostname === 'metadata.google.internal' ||
        hostname === 'instance-data' ||
        isPrivateIPv4(hostname) ||
        isPrivateIPv6(hostname)
    )
        throw new Error('Import URL host is not allowed')

    return url
}

export const fetchSafeImage = async (source: string, maxRedirects = 3) => {
    let current = assertSafeImportUrl(source)

    for (let redirect = 0; redirect <= maxRedirects; redirect += 1) {
        const response = await fetch(current, {
            method: 'GET',
            redirect: 'manual',
            headers: { accept: importedUploadContentTypes.join(', ') },
        })

        if ([301, 302, 303, 307, 308].includes(response.status)) {
            if (redirect === maxRedirects) throw new Error('Import URL redirected too many times')
            const location = response.headers.get('location')
            if (!location) throw new Error('Import redirect has no Location header')
            current = assertSafeImportUrl(new URL(location, current).href)
            continue
        }

        if (!response.ok) throw new Error(`Import failed with HTTP ${response.status}`)
        const contentType = response.headers.get('content-type')?.split(';', 1)[0]?.trim()
        if (
            !contentType ||
            !importedUploadContentTypes.includes(
                contentType as (typeof importedUploadContentTypes)[number],
            )
        )
            throw new Error('Import response is not an allowed raster image')

        const contentLength = Number(response.headers.get('content-length'))
        if (Number.isFinite(contentLength) && contentLength > MAX_ADMIN_UPLOAD_BYTES)
            throw new Error('Import response exceeds 10 MiB')
        if (!response.body) throw new Error('Import response has no body')

        let received = 0
        const boundedBody = response.body.pipeThrough(
            new TransformStream<Uint8Array, Uint8Array>({
                transform(chunk, controller) {
                    received += chunk.byteLength
                    if (received > MAX_ADMIN_UPLOAD_BYTES)
                        throw new Error('Import response exceeds 10 MiB')
                    controller.enqueue(chunk)
                },
            }),
        )

        return { body: boundedBody, contentType, source: current.href }
    }

    throw new Error('Import URL could not be fetched')
}
