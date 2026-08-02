import { Files } from 'files-sdk'
import { r2 } from 'files-sdk/r2'

let storage: Files | undefined

export const getStorage = () => {
    if (storage) return storage

    const config = {
        accountId: process.env.R2_ACCOUNT_ID ?? process.env.CLOUDFLARE_ACCOUNT_ID,
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        bucket: process.env.R2_BUCKET,
        publicBaseUrl: process.env.R2_DOMAIN,
    }
    const missing = Object.entries(config)
        .filter(([, value]) => !value)
        .map(([name]) => name)
    if (missing.length)
        throw new Error(`R2 signed uploads are unavailable: missing ${missing.join(', ')}`)

    storage = new Files({
        adapter: r2({
            accountId: config.accountId!,
            accessKeyId: config.accessKeyId!,
            secretAccessKey: config.secretAccessKey!,
            bucket: config.bucket!,
            publicBaseUrl: config.publicBaseUrl!,
        }),
    })
    return storage
}
