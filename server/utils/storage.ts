import { Files } from 'files-sdk'
import { r2 } from 'files-sdk/r2'

export const storage = new Files({
    adapter: r2({
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        bucket: process.env.R2_BUCKET!,
        publicBaseUrl: process.env.R2_DOMAIN!,
    }),
})
