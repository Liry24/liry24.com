import { ofetch } from 'ofetch'

interface Artist {
    external_urls: { spotify: string }
    href: string
    id: string
    name: string
    type: 'artist'
    uri: string
}

interface Image {
    url: string
    height: number | null
    width: number | null
}

interface Track {
    album: {
        album_type: 'album' | 'single' | 'compilation'
        artists: Artist[]
        available_markets: string[]
        external_urls: { spotify: string }
        href: string
        id: string
        images: Image[]
        name: string
        release_date: string
        release_date_precision: 'day' | 'month' | 'year'
        total_tracks: number
        type: 'album'
        uri: string
    }
    artists: Artist[]
    available_markets: string[]
    disc_number: number
    duration_ms: number
    explicit: boolean
    external_ids: { isrc: string }
    external_urls: { spotify: string }
    href: string
    id: string
    is_local: false
    name: string
    popularity: number
    preview_url: string | null
    track_number: number
    type: 'track'
    uri: string
}

interface CurrentlyPlaying {
    is_playing: boolean
    timestamp: number
    context: {
        external_urls: { spotify: string }
        href: string
        type: 'collection'
        uri: string
    }
    progress_ms: number
    currently_playing_type: 'track'
    actions: { disallows: { resuming: boolean } }
    item: Track
}

interface Playlist {
    collaborative: boolean
    description: string
    external_urls: { spotify: string }
    followers: { href: null; total: number }
    href: string
    id: string
    images: Image[]
    name: string
    owner: {
        display_name: string
        external_urls: { spotify: string }
        href: string
        id: string
        type: 'user'
        uri: string
    }
    primary_color: null
    public: true
    snapshot_id: string
    tracks: {
        href: string
        items: Track[]
        limit: number
        next: string
        offset: number
        previous: null
        total: number
    }
    type: 'playlist'
    uri: string
}

const spotifyFetch = ofetch.create({ baseURL: 'https://api.spotify.com/v1' })

export const getAccessToken = async () => {
    try {
        const response = await ofetch<{
            access_token: string
            token_type: string
            expires_in: number
            expires: number
        }>('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization:
                    'Basic ' +
                    btoa(
                        `${import.meta.env.SPOTIFY_CLIENT_ID}:${import.meta.env.SPOTIFY_CLIENT_SECRET}`
                    ),
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: import.meta.env.SPOTIFY_REFRESH_TOKEN,
            }),
        })

        return response
    } catch (error) {
        console.error('Error fetching access token:', error)
    }
}

export const getNowPlaying = async (accessToken: string) => {
    try {
        const response = await spotifyFetch<CurrentlyPlaying>(
            'me/player/currently-playing',
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        )

        return response
    } catch (error) {
        console.error('Error fetching now playing track:', error)
    }
}

export const getPlaylist = async (accessToken: string, playlistId: string) => {
    try {
        const response = await spotifyFetch<Playlist>(
            `playlists/${playlistId}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        )
        return response
    } catch (error) {
        console.error('Error fetching playlist:', error)
    }
}
