import { z } from 'zod'

const AVATAR_REGEX = /^\/avatar\.(png|jpg|jpeg|webp)$/i

const formatToWsrv = {
    jpeg: 'jpg',
    jpg: 'jpg',
    png: 'png',
    webp: 'webp',
} as const

type AvatarFormat = keyof typeof formatToWsrv

const sizeValidator = z
    .union([z.string().regex(/^\d+$/), z.number()])
    .transform((val) => (typeof val === 'string' ? parseInt(val, 10) : val))
    .refine((val) => val > 0 && val <= 2048, {
        message: 'Size must be between 1 and 2048',
    })

const query = z
    .object({
        size: sizeValidator.optional(),
        s: sizeValidator.optional(),
    })
    .transform((data) => ({
        size: data.size ?? data.s ?? 2048,
    }))

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig(event)
    const path = getRequestURL(event).pathname
    const match = path.match(AVATAR_REGEX)

    if (!match) return

    const format = match[1]!.toLowerCase() as AvatarFormat

    const result = await getValidatedQuery(event, (q) => query.safeParse(q))
    if (!result.success) throw serverError.badRequest()

    const params = new URLSearchParams({
        url: `${config.public.imagesDomain}/avatar.png`,
        w: String(result.data.size),
        h: String(result.data.size),
        fit: 'inside',
        output: formatToWsrv[format],
    })

    const upstream = await fetch(`https://wsrv.nl/?${params}&we`)

    return new Response(upstream.body, {
        status: upstream.status,
        headers: {
            'Content-Type': upstream.headers.get('Content-Type') ?? 'application/octet-stream',
        },
    })
})
