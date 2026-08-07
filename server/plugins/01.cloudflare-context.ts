import { attachCloudflareContext } from '../utils/cloudflareContext'

export default defineNitroPlugin((nitroApp) => {
    nitroApp.hooks.hook('request', attachCloudflareContext)
})
