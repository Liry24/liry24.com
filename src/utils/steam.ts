import { getSecret } from 'astro:env/server'
import { ofetch } from 'ofetch'

interface PlayerSummaries {
    response: {
        players: {
            steamid: string
            communityvisibilitystate: number
            profilestate: number
            personaname: string
            commentpermission: number
            profileurl: string
            avatar: string
            avatarmedium: string
            avatarfull: string
            avatarhash: string
            lastlogoff: number
            personastate: number
            realname: string
            primaryclanid: string
            timecreated: number
            personastateflags: number
            loccountrycode: string
        }[]
    }
}

interface OwnedGames {
    response: {
        game_count: number
        games: {
            appid: number
            playtime_forever: number
            playtime_windows_forever: number
            playtime_mac_forever: number
            playtime_linux_forever: number
            playtime_deck_forever: number
            rtime_last_played: number
            playtime_disconnected: number
        }
    }
}

const personaState = {
    0: { label: 'Offline', class: 'text-zinc-400 bg-zinc-800' },
    1: { label: 'Online', class: 'text-zinc-400 bg-zinc-800' },
    2: { label: 'Busy', class: 'text-zinc-400 bg-zinc-800' },
    3: { label: 'Away', class: 'text-zinc-400 bg-zinc-800' },
    4: { label: 'Snooze', class: 'text-zinc-400 bg-zinc-800' },
    5: { label: 'Looking to trade', class: 'text-zinc-400 bg-zinc-800' },
    6: { label: 'Looking to play', class: 'text-zinc-400 bg-zinc-800' },
}

export const getProfile = async (steamId: string) => {
    const STEAM_API_KEY = await getSecret('STEAM_API_KEY')
    const steamFetch = ofetch.create({
        baseURL: 'https://api.steampowered.com',
        query: { key: STEAM_API_KEY, format: 'json', steamId: steamId },
    })

    const [playerSummaries, ownedGames] = await Promise.all([
        steamFetch<PlayerSummaries>('/ISteamUser/GetPlayerSummaries/v2/', {
            query: {
                steamids: steamId,
            },
        }),
        steamFetch<OwnedGames>('/IPlayerService/GetOwnedGames/v1/', {
            query: {
                steamid: steamId,
                format: 'json',
            },
        }),
    ])

    return {
        summaries: {
            ...playerSummaries.response.players[0],
            personastate:
                personaState[
                    playerSummaries.response.players[0]
                        .personastate as keyof typeof personaState
                ],
        },
        ownedGames: ownedGames.response,
    }
}
