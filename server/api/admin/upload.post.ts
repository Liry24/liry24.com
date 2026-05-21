import { z } from 'zod'

const body = z.object({
    key: z.string(),
    contentType: z.string(),
})

export default adminSessionEventHandler(async () => {
    const { key, contentType } = await validateBody(body)

    const [uploadInfo, publicUrl] = await Promise.all([
        storage.signedUploadUrl(key, { contentType, expiresIn: 300 }),
        storage.url(key),
    ])

    return { uploadInfo, publicUrl, key }
})
