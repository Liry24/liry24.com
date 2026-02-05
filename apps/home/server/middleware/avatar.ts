import sharp from 'sharp'
import { z } from 'zod'

const AVATAR_REGEX = /^\/avatar\.(png|jpg|jpeg|webp|avif)$/i

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

    const format = match[1]?.toLowerCase()

    try {
        const result = await getValidatedQuery(event, (q) => query.safeParse(q))
        if (!result.success)
            throw createError({
                status: 400,
                statusText: 'Invalid query parameters',
            })

        const { size } = result.data

        const imageBlob = await $fetch<Blob>('/avatar.png', {
            baseURL: config.public.imagesDomain,
        })

        if (!imageBlob) {
            throw createError({
                status: 404,
                statusText: 'Source image not found',
            })
        }

        const imageBuffer = Buffer.from(await imageBlob.arrayBuffer())
        const sharpImg = sharp(imageBuffer).resize(size, size, { fit: 'cover' })

        if (format === 'webp') sharpImg.webp()
        else if (format === 'png') sharpImg.png()
        else if (format === 'jpg' || format === 'jpeg') sharpImg.jpeg()
        else if (format === 'avif') sharpImg.avif()

        const resultBuffer = await sharpImg.toBuffer()

        setResponseHeader(event, 'Content-Type', `image/${format === 'jpg' ? 'jpeg' : format}`)
        setResponseHeader(event, 'CDN-Cache-Control', `max-age=${60 * 60 * 24 * 30}`)
        return resultBuffer
    } catch (error) {
        if (isError(error)) throw error
        console.error('Error processing avatar image:', error)
        throw createError({
            status: 500,
            statusText: 'Failed to process image',
        })
    }
})
