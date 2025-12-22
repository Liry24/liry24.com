import type { VercelConfig } from '@vercel/config/v1'

const redirects = {
    liria: 'https://liria.me',
    booth: 'https://eicosapenta.booth.pm',
    artstation: 'https://www.artstation.com/liry24',
    github: 'https://github.com/Liry24',
    x: 'https://x.com/Liry24g',
    twitter: 'https://twitter.com/Liry24g',
    discord: 'https://discord.com/users/365789612024659969',
    vrchat: 'https://vrchat.com/home/user/usr_933f7024-bf54-408e-88fe-43bf2b81ccf8',
    avatio: 'https://avatio.me/@liry24',
    spotify: 'https://spti.fi/liry24',
    steam: 'https://steamcommunity.com/id/Liry24',
    valorant: 'https://tracker.gg/valorant/profile/riot/Liry%23yoshi/overview',
    pulse: 'https://plsdb.com/profile/liry24',
    geartics: 'https://geartics.com/liry24',
}

export const config: VercelConfig = {
    cleanUrls: true,
    trailingSlash: false,

    bulkRedirectsPath: JSON.stringify([
        ...Object.entries(redirects).map(([key, value]) => ({
            source: `/${key}`,
            destination: value,
            permanent: true,
        })),
    ]),
}
