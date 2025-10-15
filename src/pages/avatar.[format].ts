import type { APIRoute } from 'astro'
import sharp from 'sharp'

const ALLOWED_FORMATS = ['png', 'jpg', 'webp'] as const
const AVATAR_URL = import.meta.glob<string>('/src/assets/images/avatar.png', {
    eager: true,
    query: '?url',
    import: 'default',
})['/src/assets/images/avatar.png']

export const GET: APIRoute = async ({ params, url }) => {
    const format = params.format?.toLowerCase()

    if (!format || !ALLOWED_FORMATS.includes(format as any)) {
        return new Response('Invalid format', { status: 400 })
    }

    if (!AVATAR_URL) {
        return new Response('Avatar not found', { status: 404 })
    }

    try {
        const imageUrl = new URL(AVATAR_URL, url.origin).toString()
        const response = await fetch(imageUrl)

        if (!response.ok)
            throw new Error(`Fetch failed: ${response.statusText}`)

        const buffer = Buffer.from(await response.arrayBuffer())
        const size = url.searchParams.get('s')
        const sizeNum = size ? parseInt(size, 10) : null

        if (
            sizeNum !== null &&
            (isNaN(sizeNum) || sizeNum < 1 || sizeNum > 4096)
        ) {
            return new Response('Invalid size (1-4096)', { status: 400 })
        }

        let image = sharp(buffer)

        if (sizeNum) {
            image = image.resize(sizeNum, sizeNum, {
                fit: 'cover',
                position: 'center',
            })
        }

        image =
            format === 'png'
                ? image.png()
                : format === 'jpg'
                  ? image.jpeg({ quality: 100 })
                  : image.webp({ quality: 100 })

        const output = await image.toBuffer()

        return new Response(new Uint8Array(output), {
            headers: {
                'Content-Type':
                    format === 'jpg' ? 'image/jpeg' : `image/${format}`,
                'Cache-Control': `max-age=${60 * 60 * 24}`, // 1 day
                'CDN-Cache-Control': `max-age=${60 * 60 * 24 * 30}`, // 30 days
            },
        })
    } catch (error) {
        console.error('Error:', error)
        return new Response('Internal server error', { status: 500 })
    }
}
