import { Router, Request, Response } from 'express'

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
// Primary: anime-specific embeds (s3taku/gogoanime) using romaji title slugs.
// Backup: VidSrc with MAL→TMDB conversion via ani.zip.
router.get('/watch/:malId/:episode', async (req: Request, res: Response) => {
    try {
        const { malId, episode } = req.params
        const epNum = parseInt(episode)
        const data = await jikanFetch(`/anime/${malId}`)
        const anime = data.data
        if (!anime) { res.status(404).json({ error: 'Anime not found' }); return }

        const sourcesList: any[] = []

        // Convert MAL ID → TMDB ID + season/episode mapping via ani.zip
        try {
            const mapRes = await fetch(`https://api.ani.zip/mappings?mal_id=${malId}`)
            if (mapRes.ok) {
                const mapData = await mapRes.json()
                const tmdbId = mapData.mappings?.themoviedb_id

                if (tmdbId) {
                    // Get correct TMDB season/episode
                    const epMapping = mapData.episodes?.[String(epNum)]
                    let tmdbSeason = epMapping?.seasonNumber || 1
                    let tmdbEpisode = epMapping?.episodeNumber || epNum

                    // Special case: The Disastrous Life of Saiki K (MAL: 33255, TMDB: 67676)
                    // MAL has 120 shorts in S1, but TMDB combines 5 shorts into 1 episode (24 total)
                    if (malId === '33255') {
                        tmdbSeason = 1
                        tmdbEpisode = Math.ceil(epNum / 5)
                    }

                    console.log(`[Anime] MAL ${malId} → TMDB ${tmdbId} (S${tmdbSeason}E${tmdbEpisode})`)

                    // 1. Primary: vidlink.pro
                    sourcesList.push({
                        url: `https://vidlink.pro/tv/${tmdbId}/${tmdbSeason}/${tmdbEpisode}`,
                        quality: 'English Sub',
                        isEmbed: true,
                        provider: 'Server 1'
                    })

                    // 2. Secondary: multiembed.mov
                    sourcesList.push({
                        url: `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${tmdbSeason}&e=${tmdbEpisode}`,
                        quality: 'English Sub',
                        isEmbed: true,
                        provider: 'Server 2'
                    })

                    // 3. Tertiary: moviesapi.club
                    sourcesList.push({
                        url: `https://moviesapi.club/tv/${tmdbId}-${tmdbSeason}-${tmdbEpisode}`,
                        quality: 'English Sub',
                        isEmbed: true,
                        provider: 'Server 3'
                    })
                }
            }
        } catch (e) {
            console.warn('[Anime] ani.zip mapping failed')
        }

        // Always include a direct MAL-based provider as a reliable fallback for long-running anime (e.g. One Piece)
        sourcesList.push({
            url: `https://vidsrc.cc/v2/embed/anime/${malId}/${epNum}`,
            quality: 'English Sub',
            isEmbed: true,
            provider: `Server ${sourcesList.length + 1}`
        })

        res.json({
            data: {
                sources: sourcesList,
                title: `${anime.title_english || anime.title} - Episode ${epNum}`,
            }
        })
    } catch (error: any) {
        console.error('[Anime] Watch Error:', error)
        res.status(500).json({ error: 'Failed to fetch streaming sources' })
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
