export const openIdDiscoveryNotSupported = () =>
    Response.json(
        {
            error: 'not_found',
            error_description:
                'OpenID Connect discovery is not enabled; use OAuth authorization server metadata.',
        },
        {
            status: 404,
            headers: {
                'cache-control': 'public, max-age=300',
            },
        },
    )
