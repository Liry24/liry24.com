import { Container, getContainer } from '@cloudflare/containers'

export class CimdMetadataFetcher extends Container {
    defaultPort = 8080
    sleepAfter = '30s'
    enableInternet = true
}

export default {
    async fetch(request, env) {
        return getContainer(env.CIMD_METADATA_FETCHER).fetch(request)
    },
} satisfies ExportedHandler<Env>
