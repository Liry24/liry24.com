import type { H3Event } from 'h3'

type CloudflareEnvironment = { env: unknown }

export const getCloudflareEnvironment = <Environment>(event: H3Event) => {
    const context = event.context as typeof event.context & {
        cloudflare?: CloudflareEnvironment
        _platform?: { cloudflare?: CloudflareEnvironment }
    }

    return (context.cloudflare?.env ?? context._platform?.cloudflare?.env) as
        | Environment
        | undefined
}
