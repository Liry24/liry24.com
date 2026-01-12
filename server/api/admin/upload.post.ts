import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'

export default adminSessionEventHandler(async ({ event }) => {
    const body = (await readBody(event)) as HandleUploadBody

    return handleUpload({
        body,
        request: event.node.req,
        onBeforeGenerateToken: async (_pathname) => ({
            allowedContentTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        }),
        // onUploadCompleted: async ({ blob: _blob, tokenPayload: _tokenPayload }) => {},
    })
})
