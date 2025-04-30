import { OG } from '../components/og/main'

export const prerender = false
export const config = {
    runtime: 'edge',
}

export const GET = async () => {
    return OG()
}
