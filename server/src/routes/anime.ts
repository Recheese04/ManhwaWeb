import { Router, Request, Response } from 'express'
import { ANIME } from '@consumet/extensions'

const router = Router()

// ─── AniList GraphQL helpers ───────────────────────────────────────────────
const ANILIST_URL = 'https://graphql.anilist.co'

async function anilistQuery(query: string, variables: Record<string, any> = {}) {
    const res = await fetch(ANILIST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ query, variables }),
    })
    const json = await res.json()
    return json.data
}

const MEDIA_FRAGMENT = `
    id
    idMal
    title { romaji english native }
    coverImage { extraLarge large }
    bannerImage
    description(asHtml: false)
    genres
    averageScore
    popularity
    episodes
    status
    season
    seasonYear
    format
    studios(isMain: true) { nodes { name } }
    nextAiringEpisode { episode timeUntilAiring }
`

// ─── Search ────────────────────────────────────────────────────────────────
router.get('/search', async (req: Request, res: Response) => {
    try {
        const { q = '' } = req.query
        if (!q) { res.status(400).json({ error: 'Missing search query' }); return }

        const data = await anilistQuery(`
            query ($search: String) {
                Page(perPage: 20) {
                    media(search: $search, type: ANIME, sort: POPULARITY_DESC) { ${MEDIA_FRAGMENT} }
                }
            }
        `, { search: q.toString() })

        const results = (data?.Page?.media || []).map(mapAnilistMedia)
        res.json({ data: results })
    } catch (error: any) {
        console.error('Anime search error:', error.message)
        res.status(500).json({ error: 'Failed to search anime' })
    }
})

// ─── Trending / Popular ───────────────────────────────────────────────────
router.get('/popular', async (_req: Request, res: Response) => {
    try {
        const data = await anilistQuery(`
            query {
                trending: Page(perPage: 20) {
                    media(type: ANIME, sort: TRENDING_DESC) { ${MEDIA_FRAGMENT} }
                }
            }
        `)

        const results = (data?.trending?.media || []).map(mapAnilistMedia)
        res.json({ data: results })
    } catch (error: any) {
        console.error('Anime popular error:', error.message)
        res.status(500).json({ error: 'Failed to get popular anime' })
    }
})

// ─── Recent / Latest ──────────────────────────────────────────────────────
router.get('/recent', async (_req: Request, res: Response) => {
    try {
        const data = await anilistQuery(`
            query {
                Page(perPage: 20) {
                    media(type: ANIME, status: RELEASING, sort: UPDATED_AT_DESC) { ${MEDIA_FRAGMENT} }
                }
            }
        `)

        const results = (data?.Page?.media || []).map(mapAnilistMedia)
        res.json({ data: results })
    } catch (error: any) {
        console.error('Anime recent error:', error.message)
        res.status(500).json({ error: 'Failed to get recent anime' })
    }
})

// ─── Anime Info (AniList + Jikan for episodes) ───────────────────────────
router.get('/info/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params

        // Get metadata from AniList
        const data = await anilistQuery(`
            query ($id: Int) {
                Media(id: $id, type: ANIME) {
                    ${MEDIA_FRAGMENT}
                    relations { edges { relationType node { id title { romaji english } coverImage { large } format } } }
                }
            }
        `, { id: parseInt(id) })

        const media = data?.Media
        if (!media) { res.status(404).json({ error: 'Anime not found' }); return }

        const info = mapAnilistMedia(media)

        // Get episodes from Jikan (MAL) if we have a MAL ID
        let episodes: any[] = []
        if (media.idMal) {
            try {
                const jikanRes = await fetch(`https://api.jikan.moe/v4/anime/${media.idMal}/episodes`)
                const jikanData = await jikanRes.json()
                episodes = (jikanData.data || []).map((ep: any) => ({
                    id: `${id}-episode-${ep.mal_id}`,
                    number: ep.mal_id,
                    title: ep.title || ep.title_japanese || `Episode ${ep.mal_id}`,
                    isFiller: ep.filler || false,
                }))
            } catch (e) {
                console.warn('Jikan episodes fetch failed, generating from count')
            }
        }

        // Fallback: generate episode list from AniList episode count
        if (episodes.length === 0 && media.episodes) {
            for (let i = 1; i <= media.episodes; i++) {
                episodes.push({
                    id: `${id}-episode-${i}`,
                    number: i,
                    title: `Episode ${i}`,
                    isFiller: false,
                })
            }
        }

        // For currently airing with unknown total episodes, generate up to next airing
        if (episodes.length === 0 && media.nextAiringEpisode) {
            const currentEp = media.nextAiringEpisode.episode - 1
            for (let i = 1; i <= currentEp; i++) {
                episodes.push({
                    id: `${id}-episode-${i}`,
                    number: i,
                    title: `Episode ${i}`,
                    isFiller: false,
                })
            }
        }

        res.json({ data: { ...info, episodes, idMal: media.idMal } })
    } catch (error: any) {
        console.error('Anime info error:', error.message)
        res.status(500).json({ error: 'Failed to get anime info' })
    }
})

// ─── Watch: Multi-source episode streaming ───────────────────────────────
router.get('/watch/:anilistId/:episode', async (req: Request, res: Response) => {
    try {
        const { anilistId, episode } = req.params
        const epNum = parseInt(episode)

        // Get the anime title from AniList to search on streaming providers
        const data = await anilistQuery(`
            query ($id: Int) {
                Media(id: $id, type: ANIME) {
                    title { romaji english }
                    idMal
                }
            }
        `, { id: parseInt(anilistId) })

        const title = data?.Media?.title?.english || data?.Media?.title?.romaji
        if (!title) { res.status(404).json({ error: 'Anime not found' }); return }

        // Try multiple providers in order
        const providers = [
            { name: 'AnimePahe', instance: new ANIME.AnimePahe() },
            { name: 'AnimeKai', instance: new ANIME.AnimeKai() },
        ]

        for (const provider of providers) {
            try {
                console.log(`[Anime] Trying ${provider.name} for "${title}" ep ${epNum}...`)
                const searchResults = await provider.instance.search(title)
                const match = searchResults.results?.[0]
                if (!match) continue

                const info = await provider.instance.fetchAnimeInfo(match.id)
                const ep = info.episodes?.find((e: any) => e.number === epNum)
                if (!ep) continue

                const sources = await provider.instance.fetchEpisodeSources(ep.id)
                if (sources?.sources?.length > 0) {
                    console.log(`[Anime] ✅ Got sources from ${provider.name}`)
                    res.json({
                        data: {
                            sources: sources.sources,
                            subtitles: sources.subtitles || [],
                            provider: provider.name,
                        }
                    })
                    return
                }
            } catch (e: any) {
                console.warn(`[Anime] ${provider.name} failed:`, e.message)
            }
        }

        res.status(404).json({ error: 'No streaming sources found. Try a different episode or anime.' })
    } catch (error: any) {
        console.error('Anime watch error:', error.message)
        res.status(500).json({ error: 'Failed to get streaming links' })
    }
})

// ─── Helper: map AniList media to our format ─────────────────────────────
function mapAnilistMedia(media: any) {
    return {
        id: media.id.toString(),
        title: media.title?.english || media.title?.romaji || 'Unknown',
        image: media.coverImage?.extraLarge || media.coverImage?.large || '',
        cover: media.bannerImage || '',
        description: media.description || '',
        genres: media.genres || [],
        rating: media.averageScore ? (media.averageScore / 10).toFixed(1) : null,
        popularity: media.popularity,
        totalEpisodes: media.episodes,
        status: media.status,
        season: media.season,
        seasonYear: media.seasonYear,
        format: media.format,
        studio: media.studios?.nodes?.[0]?.name || null,
        nextAiring: media.nextAiringEpisode || null,
    }
}

export default router
