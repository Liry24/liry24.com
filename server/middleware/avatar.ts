import { PhotonImage, resize, SamplingFilter } from '@cf-wasm/photon'
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
        if (!result.success) throw serverError.badRequest()

        const { size } = result.data

        const imageBlob = await $fetch<Blob>('/avatar.png', {
            baseURL: config.public.imagesDomain,
        })

        if (!imageBlob) throw serverError.internalServerError()

        const imageBytes = new Uint8Array(await imageBlob.arrayBuffer())
        const photonImage = PhotonImage.new_from_byteslice(imageBytes)
        const resized = resize(photonImage, size, size, SamplingFilter.Lanczos3)

        let outputBytes: Uint8Array
        let contentType: string

        if (format === 'webp') {
            outputBytes = resized.get_bytes_webp()
            contentType = 'image/webp'
        } else if (format === 'avif') {
            outputBytes = resized.get_bytes_webp()
            contentType = 'image/webp'
        } else if (format === 'jpg' || format === 'jpeg') {
            outputBytes = resized.get_bytes_jpeg(90)
            contentType = 'image/jpeg'
        } else {
            outputBytes = resized.get_bytes()
            contentType = 'image/png'
        }

        photonImage.free()
        resized.free()

        setResponseHeader(event, 'Content-Type', contentType)
        setResponseHeader(event, 'CDN-Cache-Control', `max-age=${60 * 60 * 24 * 30}`)
        return outputBytes
    } catch (error) {
        if (isError(error)) throw error
        console.error('Error processing avatar image:', error)
        throw serverError.internalServerError()
    }
})
