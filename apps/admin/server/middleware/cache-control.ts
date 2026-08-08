export default eventHandler((event) => {
    setResponseHeaders(event, {
        'Cache-Control': 'no-store',
        'Cloudflare-CDN-Cache-Control': 'no-store',
    })
})
