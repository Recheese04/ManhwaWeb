import { Router, Request, Response } from 'express'
import { ANIME } from '@consumet/extensions'

const router = Router()

// ─── Jikan (MyAnimeList) helpers ──────────────────────────────────────────
const JIKAN_URL = 'https://api.jikan.moe/v4'

async function jikanFetch(endpoint: string) {
    const res = await fetch(`${JIKAN_URL}${endpoint}`)
    if (res.status === 429) {
        // Rate limited - wait 1s and try once more
        await new Promise(resolve => setTimeout(resolve, 1000))
        const retry = await fetch(`${JIKAN_URL}${endpoint}`)
        return await retry.json()
    }
    return await res.json()
}

// ─── Search ────────────────────────────────────────────────────────────────
router.get('/search', async (req: Request, res: Response) => {
    try {
        const { q = '' } = req.query
        if (!q) { res.status(400).json({ error: 'Missing search query' }); return }

        const data = await jikanFetch(`/anime?q=${encodeURIComponent(q.toString())}&sfw=true&limit=25`)
        const results = (data.data || []).map(mapJikanAnime)
        res.json({ data: results })
    } catch (error: any) {
        console.error('Anime search error:', error.message)
        res.status(500).json({ error: 'Failed to search anime' })
    }
})

// ─── Trending / Popular ───────────────────────────────────────────────────
router.get('/popular', async (_req: Request, res: Response) => {
    try {
        console.log('[Anime] Fetching popular anime from Jikan...')
        const data1 = await jikanFetch('/top/anime?filter=airing&limit=25&page=1')
        const data2 = await jikanFetch('/top/anime?filter=airing&limit=25&page=2')
        
        const allData = [...(data1.data || []), ...(data2.data || [])]
        console.log(`[Anime] Jikan returned ${allData.length} results total`)
        
        const results = allData.map(mapJikanAnime)
        res.json({ data: results })
    } catch (error: any) {
        console.error('Anime popular error:', error.message)
        res.status(500).json({ error: 'Failed to get popular anime' })
    }
})

// ─── Recent Episodes ──────────────────────────────────────────────────────
router.get('/recent', async (_req: Request, res: Response) => {
    try {
        const data = await jikanFetch('/seasons/now?limit=25')
        const results = (data.data || []).map(mapJikanAnime)
        res.json({ data: results })
    } catch (error: any) {
        console.error('Anime recent error:', error.message)
        res.status(500).json({ error: 'Failed to get recent anime' })
    }
})

// ─── Anime Info ──────────────────────────────────────────────────────────
router.get('/info/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        // Jikan uses MAL ID, so we assume :id is the MAL ID now
        const data = await jikanFetch(`/anime/${id}/full`)
        const anime = data.data
        if (!anime) { res.status(404).json({ error: 'Anime not found' }); return }

        // Fetch ALL episode pages from Jikan (max 100 per page)
        let episodes: any[] = []
        let page = 1
        let hasMore = true
        while (hasMore) {
            try {
                const epData = await jikanFetch(`/anime/${id}/episodes?page=${page}`)
                const pageEps = (epData.data || []).map((ep: any) => ({
                    id: `${id}-episode-${ep.mal_id}`,
                    number: ep.mal_id,
                    title: ep.title || `Episode ${ep.mal_id}`,
                    isFiller: ep.filler || false,
                }))
                episodes = [...episodes, ...pageEps]
                hasMore = epData.pagination?.has_next_page === true
                page++
                // Jikan rate limit: wait 400ms between requests
                if (hasMore) await new Promise(r => setTimeout(r, 400))
            } catch {
                hasMore = false
            }
        }

        // 4. Fill in any gaps if we have a total count
        const totalCount = anime.episodes || 0
        const currentCount = episodes.length
        
        // If we have a total count but the list is incomplete, fill it up
        if (totalCount > currentCount) {
            const existingNumbers = new Set(episodes.map(e => e.number))
            for (let i = 1; i <= totalCount; i++) {
                if (!existingNumbers.has(i)) {
                    episodes.push({
                        id: `${id}-episode-${i}`,
                        number: i,
                        title: `Episode ${i}`,
                        isFiller: false
                    })
                }
            }
        }

        // Sort episodes by number just in case
        episodes.sort((a, b) => a.number - b.number)

        res.json({
            data: {
                ...mapJikanAnime(anime),
                description: anime.synopsis || '',
                genres: anime.genres?.map((g: any) => g.name) || [],
                episodes,
                idMal: anime.mal_id
            }
        })
    } catch (error: any) {
        console.error('Anime info error:', error.message)
        res.status(500).json({ error: 'Failed to get anime info' })
    }
})

// ─── Watch ────────────────────────────────────────────────────────────────
router.get('/watch/:malId/:episode', async (req: Request, res: Response) => {
    try {
        const { malId, episode } = req.params
        const epNum = parseInt(episode)

        // 1. Get anime title from Jikan
        const data = await jikanFetch(`/anime/${malId}`)
        const anime = data.data
        if (!anime) { res.status(404).json({ error: 'Anime not found' }); return }
        const titles = [anime.title_english, anime.title, anime.title_japanese].filter(Boolean)

        // 2. Try working providers from my test
        const providers = [
            { name: 'AnimeSaturn', instance: new ANIME.AnimeSaturn() },
            { name: 'AnimeUnity', instance: new ANIME.AnimeUnity() },
        ]

        for (const provider of providers) {
            try {
                console.log(`[Anime] Trying provider ${provider.name}`)
                for (const titleToSearch of titles) {
                    console.log(`[Anime] Searching ${provider.name} for "${titleToSearch}" ep ${epNum}`)
                    const searchResults = await provider.instance.search(titleToSearch)
                    
                    const match = searchResults.results?.find((r: any) => {
                        const target = titleToSearch.toLowerCase()
                        const found = (r.title || '').toLowerCase()
                        return found.includes(target) || target.includes(found)
                    }) || searchResults.results?.[0]

                    if (!match) continue
                    console.log(`[Anime] Found match on ${provider.name}: "${match.title}" (ID: ${match.id})`)
                    
                    const info = await provider.instance.fetchAnimeInfo(match.id)
                    const ep = info.episodes?.find((e: any) => e.number === epNum || e.number === epNum.toString())
                    
                    if (!ep) {
                        console.log(`[Anime] Episode ${epNum} not found in ${provider.name} results`)
                        continue
                    }

                    const sources = await provider.instance.fetchEpisodeSources(ep.id)
                    if (sources?.sources?.length > 0) {
                        console.log(`[Anime] ✅ Found sources from ${provider.name}`)
                        res.json({
                            data: {
                                sources: sources.sources,
                                title: `${anime.title} - Episode ${epNum}`,
                                provider: provider.name,
                            }
                        })
                        return
                    }
                }
            } catch (e: any) {
                console.warn(`[Anime] ${provider.name} error:`, e.message)
            }
        }
    } catch (error: any) {
        console.error('[Anime] Watch route error:', error.message)
        res.status(500).json({ error: 'Failed to get streaming links' })
    }
})

function mapJikanAnime(anime: any) {
    return {
        id: anime.mal_id.toString(),
        title: anime.title_english || anime.title,
        image: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || '',
        cover: anime.images?.jpg?.large_image_url || '',
        rating: anime.score ? anime.score.toString() : null,
        totalEpisodes: anime.episodes,
        status: anime.status,
        format: anime.type,
        season: anime.season,
        seasonYear: anime.year,
        studio: anime.studios?.[0]?.name || null,
        popularity: anime.members
    }
}

export default router
