import { getStorage } from '../../utils/storage'

export default adminSessionEventHandler(async () => {
    const input = await validateBody(adminUploadRequestSchema)
    const key = normalizeAdminUploadKey(input.key)
    const storage = getStorage()

    const [uploadInfo, publicUrl] = await Promise.all([
        storage.signedUploadUrl(key, {
            contentType: input.contentType,
            expiresIn: 300,
        }),
        storage.url(key),
    ])

    return {
        uploadInfo,
        publicUrl,
        key,
        constraints: {
            contentType: input.contentType,
            maxBytes: MAX_ADMIN_UPLOAD_BYTES,
            requestedBytes: input.size,
        },
    }
})
