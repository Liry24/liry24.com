import { Resvg } from '@resvg/resvg-js'
import type { APIRoute } from 'astro'
import { getFontData } from 'astro:assets'
import satori from 'satori'

export const prerender = false

export const GET: APIRoute = async (context) => {
    const element = {
        type: 'div',
        props: {
            style: {
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#0b0b0b',
            },
            children: [
                {
                    type: 'span',
                    props: {
                        style: {
                            fontSize: '124px',
                            letterSpacing: '0.2em',
                            color: 'white',
                            paddingLeft: '0.3em',
                        },
                        children: 'Liry24',
                    },
                },
            ],
        },
    }

    const fontData = getFontData('--font-geist')
    const ttfSrcUrl = fontData
        .find((font) => font.weight === '100')!
        .src.find((src) => src.format === 'ttf')!

    const svg = await satori(element, {
        width: 1200,
        height: 630,
        fonts: [
            {
                name: 'Geist',
                data: await fetch(
                    new URL(ttfSrcUrl.url, context.url.origin)
                ).then((res) => res.arrayBuffer()),
            },
        ],
    })

    const resvg = new Resvg(svg)
    const pngData = resvg.render().asPng()

    return new Response(new Uint8Array(pngData), {
        status: 200,
        headers: {
            'Content-Type': 'image/png',
            'Cache-Control': `max-age=${60 * 60}`, // 1 hour
            'CDN-Cache-Control': `max-age=${60 * 60 * 24}`, // 1 day
        },
    })
}
