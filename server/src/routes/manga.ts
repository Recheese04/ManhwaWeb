import { Router, Request, Response } from 'express'
import { MANGA } from '@consumet/extensions'

const router = Router()
const MANGADEX_API = 'https://api.mangadex.org'
const weebCentral = new MANGA.WeebCentral()

// Helper to proxy requests to MangaDex
async function mangadexFetch(path: string, params?: Record<string, string>) {
    const url = new URL(`${MANGADEX_API}${path}`)
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value)
        })
    }

    const response = await fetch(url.toString(), {
        headers: {
            'Content-Type': 'application/json',
        },
    })

    if (!response.ok) {
        throw new Error(`MangaDex API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
}

// Helper: Extract cover filename from manga relationships
function getCoverUrl(manga: any, reqHost?: string): string | null {
    const coverRel = manga.relationships?.find((r: any) => r.type === 'cover_art')
    if (coverRel?.attributes?.fileName) {
        // If we have reqHost, make it an absolute URL. Otherwise, rely on frontend prepending it.
        // Actually, just returning the relative path is safest, and the frontend will attach the API URL.
        return `/api/img-proxy?url=${encodeURIComponent(`https://uploads.mangadex.org/covers/${manga.id}/${coverRel.attributes.fileName}.512.jpg`)}`
    }
    return null
}

// Helper: Extract title from manga
function getTitle(manga: any): string {
    const attrs = manga.attributes
    if (!attrs) return 'Untitled'

    // MangaDex often puts Romaji in the main `title.en`.
    // The true, translated English name is usually in `altTitles`.
    const enAltTitle = attrs.altTitles?.find((t: any) => t.en)
    if (enAltTitle && enAltTitle.en) {
        return enAltTitle.en
    }

    if (!attrs.title) return 'Untitled'

    // Fallback Priority: English -> English Romanized -> Japanese Romanized -> Japanese -> First available
    return attrs.title.en ||
        attrs.title['en-ro'] ||
        attrs.title['ja-ro'] ||
        attrs.title.ja ||
        Object.values(attrs.title)[0] as string ||
        'Untitled'
}

// Helper: Extract alt titles
function getAltTitles(manga: any): string[] {
    return (manga.attributes?.altTitles || [])
        .map((t: any) => t.en || t['ja-ro'] || Object.values(t)[0])
        .filter(Boolean)
        .slice(0, 3)
}

// Helper: Extract author name
function getAuthor(manga: any): string {
    const author = manga.relationships?.find((r: any) => r.type === 'author')
    return author?.attributes?.name || 'Unknown'
}

// Helper: Extract artist name
function getArtist(manga: any): string {
    const artist = manga.relationships?.find((r: any) => r.type === 'artist')
    return artist?.attributes?.name || getAuthor(manga)
}

// Helper: Transform MangaDex manga to our format
function transformManga(manga: any, chapterMap: Record<string, string> = {}) {
    const attrs = manga.attributes
    const tags = attrs.tags?.map((t: any) => t.attributes?.name?.en).filter(Boolean) || []

    // Determine type (manga, manhwa, manhua)
    const demographic = attrs.publicationDemographic || ''
    const origLang = attrs.originalLanguage || ''
    let type: 'manga' | 'manhwa' | 'manhua' = 'manga'
    if (origLang === 'ko') type = 'manhwa'
    else if (origLang === 'zh' || origLang === 'zh-hk') type = 'manhua'

    const latestChapterId = attrs.latestUploadedChapter
    const chapterNumber = latestChapterId && chapterMap[latestChapterId] ? chapterMap[latestChapterId] : null

    return {
        id: manga.id,
        title: getTitle(manga),
        slug: manga.id,
        altTitles: getAltTitles(manga),
        cover: getCoverUrl(manga) || 'https://placehold.co/300x400/1a1a2e/38bdf8?text=No+Cover',
        banner: getCoverUrl(manga),
        type,
        status: attrs.status === 'completed' ? 'completed' : attrs.status === 'hiatus' ? 'hiatus' : 'ongoing',
        rating: 0,
        views: 0,
        bookmarks: 0,
        synopsis: attrs.description?.en || attrs.description?.['ja-ro'] || 'No description available.',
        author: getAuthor(manga),
        artist: getArtist(manga),
        genres: tags.slice(0, 8),
        latestChapter: chapterNumber,
        createdAt: attrs.createdAt || new Date().toISOString(),
        updatedAt: attrs.updatedAt || new Date().toISOString(),
    }
}

// Helper: Batch fetch actual chapter numbers from a list of mangas
async function fetchLatestChapterNumbers(mangas: any[]): Promise<Record<string, string>> {
    const chapterMap: Record<string, string> = {}
    const chapterIds = mangas
        .map((m: any) => m.attributes?.latestUploadedChapter)
        .filter(Boolean)

    if (chapterIds.length > 0) {
        // Slice to max 100 per request, MangaDex limit
        const chapterUrl = new URL(`${MANGADEX_API}/chapter`)
        const uniqueIds = Array.from(new Set(chapterIds)).slice(0, 100)
        uniqueIds.forEach(id => chapterUrl.searchParams.append('ids[]', id as string))

        try {
            const chapRes = await fetch(chapterUrl.toString())
            if (chapRes.ok) {
                const chapData = await chapRes.json()
                chapData.data?.forEach((c: any) => {
                    if (c.attributes?.chapter) {
                        chapterMap[c.id] = c.attributes.chapter
                    }
                })
            }
        } catch (err) {
            console.error("Failed to fetch chapter numbers in batch", err)
        }
    }
    return chapterMap
}

const MANGADEX_TAGS: Record<string, string> = {
    'Action': '391b0423-d847-456f-aff0-8b0cfc03066b',
    'Adventure': '87cc87cd-a395-47af-b27a-93258283bbc6',
    'Aliens': 'e64f6742-c834-471d-8d72-dd51fc02b835',
    'Animals': '3de8c75d-8ee3-48ff-98ee-e20a65c86451',
    'Boys\' Love': '5920b825-4181-4a17-beeb-9918b0ff7a30',
    'Comedy': '4d32cc48-9f00-4cca-9b5a-a839f0764984',
    'Cooking': 'ea2bc92d-1c26-4930-9b7c-d5c0dc1b6869',
    'Crime': '5ca48985-9a9d-4bd8-be29-80dc0303db72',
    'Crossdressing': '9ab53f92-3eed-4e9b-903a-917c86035ee3',
    'Delinquents': 'da2d50ca-3018-4cc0-ac7a-6b7d472a29ea',
    'Demons': '39730448-9a5f-48a2-85b0-a70db87b1233',
    'Drama': 'b9af3a63-f058-46de-a9a0-e0c13906197a',
    'Fantasy': 'cdc58593-87dd-415e-bbc0-2ec27bf404cc',
    'Genderswap': '2bd2e8d0-f146-434a-9b51-fc9ff2c5fe6a',
    'Ghosts': '3bb26d85-09d5-4d2e-880c-c34b974339e9',
    'Girls\' Love': 'a3c67850-4684-404e-9b7f-c69850ee5da6',
    'Gyaru': 'fad12b5e-68ba-460e-b933-9ae8318f5b65',
    'Harem': 'aafb99c1-7f60-43fa-b75f-fc9502ce29c7',
    'Historical': '33771934-028e-4cb3-8744-691e866a923e',
    'Horror': 'cdad7e68-1419-41dd-bdce-27753074a640',
    'Incest': '5bd0e105-4481-44ca-b6e7-7544da56b1a3',
    'Isekai': 'ace04997-f6bd-436e-b261-779182193d3d',
    'Loli': '2d1f5d56-a1e5-4d0d-a961-2193588b08ec',
    'Mafia': '85daba54-a71c-4554-8a28-9901a8b0afad',
    'Magic': 'a1f53773-c69a-4ce5-8cab-fffcd90b1565',
    'Magical Girls': '81c836c9-914a-4eca-981a-560dad663e73',
    'Mahjong': 'cb562697-929f-4d28-9d66-6d3995bf2592',
    'Martial Arts': '799c202e-7daa-44eb-9cf7-8a3c0441531e',
    'Mecha': '50880a9d-5440-4732-9afb-8f457127e836',
    'Medical': 'c8cbe35b-1b2b-4a3f-9c37-db84c4514856',
    'Military': 'ac72833b-c4e9-4878-b9db-6c8a4a99444a',
    'Monster Girls': 'dd1f77c5-dea9-4e2b-97ae-224af09caf99',
    'Monsters': '36fd93ea-e8b8-445e-b836-358f02b3d33d',
    'Music': 'f42fbf9e-188a-447b-9fdc-f19dc1e4d685',
    'Mystery': 'ee968100-4191-4968-93d3-f82d72be7e46',
    'Ninja': '489dd859-9b61-4c37-af75-5b18e88daafc',
    'Office Workers': '92d6d951-ca5e-429c-ac78-451071cbf064',
    'Philosophical': 'b1e97889-25b4-4258-b28b-cd7f4d28ea9b',
    'Police': 'df33b754-73a3-4c54-80e6-1a74a8058539',
    'Post-Apocalyptic': '9467335a-1b83-4497-9231-765337a00b96',
    'Psychological': '3b60b75c-a2d7-4860-ab56-05f391bb889c',
    'Reincarnation': '0bc90acb-ccc1-44ca-a34a-b9f3a73259d0',
    'Reverse Harem': '65761a2a-415e-47f3-bef2-a9dababba7a6',
    'Romance': '423e2eae-a7a2-4a8b-ac03-a8351462d71d',
    'Samurai': '81183756-1453-4c81-aa9e-f6e1b63be016',
    'School Life': 'caaa44eb-cd40-4177-b930-79d3ef2afe87',
    'Sci-Fi': '256c8bd9-4904-4360-bf4f-508a76d67183',
    'Shota': 'ddefd648-5140-4e5f-ba18-4eca4071d19b',
    'Slice of Life': 'e5301a23-ebd9-49dd-a0cb-2add944c7fe9',
    'Sports': '69964a64-2f90-4d33-beeb-f3ed2875eb4c',
    'Superhero': '7064a261-a137-4d3a-8848-2d385de3a99c',
    'Supernatural': 'eabc5b4c-6aff-42f3-b657-3e90cbd00b75',
    'Survival': '5fff9cde-849c-4d78-aab0-0d52b2ee1d25',
    'Thriller': '07251805-a27e-4d59-b488-f0bfbec15168',
    'Time Travel': '292e862b-2d17-4062-90a2-0356caa4ae27',
    'Traditional Games': '31932a7e-5b8e-49a6-9f12-2afa39dc544c',
    'Tragedy': 'f8f62932-27da-4fe4-8ee1-6779a8c5edba',
    'Vampires': 'd7d1730f-6eb0-4ba6-9437-602cac38664c',
    'Video Games': '9438db5a-7e2a-4ac0-b39e-e0d95a34b8a8',
    'Villainess': 'd14322ac-4d6f-4e9b-afd9-629d5f4d8a41',
    'Virtual Reality': '8c86611e-fab7-4986-9dec-d1a2f44acdd5',
    'Wuxia': 'acc803a4-c95a-4c22-86fc-eb6b582d82a2',
    'Zombies': '631ef465-9aba-4afb-b0fc-ea10efe274a8',
}

const MANGADEX_DEMOGRAPHICS: Record<string, string> = {
    'Shounen': 'shounen',
    'Shoujo': 'shoujo',
    'Seinen': 'seinen',
    'Josei': 'josei',
}

/**
 * GET /api/manga/search
 * Search for manga by title
 */
router.get('/search', async (req: Request, res: Response) => {
    try {
        const { q = '', limit = '20', offset = '0', type, status, genre } = req.query

        // Need to handle includes[] specially
        const url = new URL(`${MANGADEX_API}/manga`)
        url.searchParams.append('limit', String(limit))
        url.searchParams.append('offset', String(offset))
        url.searchParams.append('includes[]', 'cover_art')
        url.searchParams.append('includes[]', 'author')
        url.searchParams.append('includes[]', 'artist')
        url.searchParams.append('contentRating[]', 'safe')
        url.searchParams.append('contentRating[]', 'suggestive')
        if (q) url.searchParams.append('title', String(q))
        if (status) url.searchParams.append('status[]', String(status))
        if (type === 'manhwa') url.searchParams.append('originalLanguage[]', 'ko')
        else if (type === 'manhua') url.searchParams.append('originalLanguage[]', 'zh')
        else if (type === 'manga') url.searchParams.append('originalLanguage[]', 'ja')
        url.searchParams.append('order[followedCount]', 'desc')

        if (genre) {
            const genresList = String(genre).split(',').map(g => g.trim()).filter(Boolean)
            let hasTags = false

            genresList.forEach(g => {
                if (MANGADEX_TAGS[g]) {
                    url.searchParams.append('includedTags[]', MANGADEX_TAGS[g])
                    hasTags = true
                } else if (MANGADEX_DEMOGRAPHICS[g]) {
                    url.searchParams.append('publicationDemographic[]', MANGADEX_DEMOGRAPHICS[g])
                }
            })

            if (hasTags) {
                url.searchParams.append('includedTagsMode', 'AND')
            }
        }

        const response = await fetch(url.toString())
        const data = await response.json()

        const chapterMap = await fetchLatestChapterNumbers(data.data || [])
        const results = (data.data || []).map((m: any) => transformManga(m, chapterMap))

        res.json({
            data: results,
            total: data.total || 0,
            limit: data.limit || 20,
            offset: data.offset || 0,
        })
    } catch (error) {
        console.error('Search error:', error)
        res.status(500).json({ error: 'Failed to search manga' })
    }
})

/**
 * GET /api/manga/popular
 * Get popular/trending manga
 */
router.get('/popular', async (_req: Request, res: Response) => {
    try {
        const url = new URL(`${MANGADEX_API}/manga`)
        url.searchParams.append('limit', '20')
        url.searchParams.append('includes[]', 'cover_art')
        url.searchParams.append('includes[]', 'author')
        url.searchParams.append('includes[]', 'artist')
        url.searchParams.append('contentRating[]', 'safe')
        url.searchParams.append('contentRating[]', 'suggestive')
        url.searchParams.append('order[followedCount]', 'desc')
        url.searchParams.append('hasAvailableChapters', 'true')

        const response = await fetch(url.toString())
        const data = await response.json()

        const chapterMap = await fetchLatestChapterNumbers(data.data || [])

        res.json({
            data: (data.data || []).map((m: any) => transformManga(m, chapterMap)),
            total: data.total || 0,
        })
    } catch (error) {
        console.error('Popular error:', error)
        res.status(500).json({ error: 'Failed to get popular manga' })
    }
})

/**
 * GET /api/manga/latest
 * Get recently updated manga
 */
router.get('/latest', async (_req: Request, res: Response) => {
    try {
        const url = new URL(`${MANGADEX_API}/manga`)
        url.searchParams.append('limit', '20')
        url.searchParams.append('includes[]', 'cover_art')
        url.searchParams.append('includes[]', 'author')
        url.searchParams.append('includes[]', 'artist')
        url.searchParams.append('contentRating[]', 'safe')
        url.searchParams.append('contentRating[]', 'suggestive')
        url.searchParams.append('order[latestUploadedChapter]', 'desc')
        url.searchParams.append('hasAvailableChapters', 'true')

        const response = await fetch(url.toString())
        const data = await response.json()

        const chapterMap = await fetchLatestChapterNumbers(data.data || [])

        res.json({
            data: (data.data || []).map((m: any) => transformManga(m, chapterMap)),
            total: data.total || 0,
        })
    } catch (error) {
        console.error('Latest error:', error)
        res.status(500).json({ error: 'Failed to get latest manga' })
    }
})

/**
 * GET /api/manga/:id
 * Get manga details by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params

        const url = new URL(`${MANGADEX_API}/manga/${id}`)
        url.searchParams.append('includes[]', 'cover_art')
        url.searchParams.append('includes[]', 'author')
        url.searchParams.append('includes[]', 'artist')

        const response = await fetch(url.toString())
        const data = await response.json()

        if (!data.data) {
            res.status(404).json({ error: 'Manga not found' })
            return
        }

        const chapterMap = await fetchLatestChapterNumbers([data.data])
        res.json({ data: transformManga(data.data, chapterMap) })
    } catch (error) {
        console.error('Manga detail error:', error)
        res.status(500).json({ error: 'Failed to get manga details' })
    }
})

/**
 * GET /api/manga/:id/chapters
 * Fetches all English chapters by merging WeebCentral and MangaDex to ensure no missing chapters
 */
router.get('/:id/chapters', async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const { order = 'asc' } = req.query

        const BATCH_SIZE = 500

        // Helper to deduplicate chapters by number (keeps the first occurrence)
        const dedup = (list: any[]) => {
            const seen = new Set<number>()
            return list.filter((ch: any) => {
                // Keep the chapter if it's the first time we've seen this number
                if (seen.has(ch.number)) return false
                seen.add(ch.number)
                return true
            })
        }

        // Function to fetch from WeebCentral
        async function fetchWeebCentralChapters(): Promise<any[]> {
            console.log(`[Chapters] Fetching from WeebCentral for ${id}...`)
            try {
                // Get manga title from MangaDex
                const detailData = await (await fetch(new URL(`${MANGADEX_API}/manga/${id}`).toString())).json()
                const attrs = detailData.data?.attributes
                const title: string =
                    attrs?.altTitles?.find((t: any) => t.en)?.en ||
                    attrs?.title?.en ||
                    attrs?.title?.['en-ro'] ||
                    Object.values(attrs?.title || {})[0] as string ||
                    ''

                if (!title) throw new Error('Could not determine manga title for WeebCentral search')

                // Helper: check if two titles share enough words (>= 50% overlap)
                const sanitize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ')
                const titleMatch = (a: string, b: string): boolean => {
                    const wa = new Set(sanitize(a).split(/\s+/).filter(w => w.length > 2))
                    const wb = new Set(sanitize(b).split(/\s+/).filter(w => w.length > 2))
                    if (wa.size === 0) return false
                    let shared = 0
                    wa.forEach(w => { if (wb.has(w)) shared++ })
                    return (shared / wa.size) >= 0.5
                }

                // Try multiple search terms to find the right manga
                const searchTerms = new Set<string>()
                if (title) searchTerms.add(title)

                // Add Romaji which WeebCentral often uses for titles like 'Sono Bisque Doll'
                if (attrs?.title?.['ja-ro']) searchTerms.add(attrs.title['ja-ro'])

                // Add alt English and Romaji titles
                if (attrs?.altTitles) {
                    attrs.altTitles.forEach((t: any) => {
                        if (t.en) searchTerms.add(t.en)
                        if (t['en-us']) searchTerms.add(t['en-us'])
                        if (t['ja-ro']) searchTerms.add(t['ja-ro'])
                    })
                }

                // If title has punctuation (colon, hyphen), search just the first part (e.g. "Frieren: Beyond..." -> "Frieren")
                const splitTitle = title.split(/[:\-]/)[0].trim()
                if (splitTitle && splitTitle.length > 2) searchTerms.add(splitTitle)

                // If title is long, try just the first 3 words
                const words = title.split(/\s+/)
                if (words.length > 3) {
                    searchTerms.add(words.slice(0, 3).join(' '))
                }

                let best: any = null
                for (const term of Array.from(searchTerms)) {
                    if (!term || term.length < 3) continue
                    const searchResults = await weebCentral.search(term)
                    const candidates = (searchResults?.results || []).filter((r: any) => {
                        const t = (r.title as string || '').toLowerCase()
                        return !t.includes('novel') && !t.includes('light novel') && !t.includes('web novel')
                    })
                    // Find a result whose title matches our search term
                    const match = candidates.find((r: any) => titleMatch(title, r.title as string) || titleMatch(term, r.title as string))
                    if (match) { best = match; break }
                }

                if (!best) {
                    console.log(`[WeebCentral] No matching manga found for: ${title}`)
                    return []
                }

                console.log(`[WeebCentral] Matched: "${best.title}" (id: ${best.id}) for "${title}"`)

                // Fetch all chapters
                const info = await weebCentral.fetchMangaInfo(best.id as string)
                const rawChapters: any[] = info.chapters || []

                if (!rawChapters.length) return []

                return rawChapters.map((ch: any, i: number) => {
                    // WeebCentral has no chapter number field — extract from title e.g. "Chapter 200"
                    const titleStr: string = ch.title || ''
                    const numMatch = titleStr.match(/chapter\s+([\d.]+)/i)
                    // Weebcentral is newest first by default
                    const num = numMatch ? parseFloat(numMatch[1]) : (rawChapters.length - i)
                    return {
                        id: `wbc:${ch.id}`,
                        number: num,
                        title: titleStr || `Chapter ${num}`,
                        pages: 0,
                        releasedAt: ch.releaseDate || new Date().toISOString(),
                        isRead: false,
                        source: 'weebcentral'
                    }
                })
            } catch (wbcErr: any) {
                console.warn(`[Chapters] WeebCentral fetch failed: ${wbcErr?.message}`)
                return []
            }
        }

        // Function to fetch from MangaDex
        async function fetchMangaDexChapters(): Promise<any[]> {
            console.log(`[Chapters] Fetching from MangaDex for ${id}...`)
            try {
                let allRaw: any[] = []
                let offset = 0
                let total = Infinity

                while (offset < total) {
                    const url = new URL(`${MANGADEX_API}/manga/${id}/feed`)
                    url.searchParams.append('limit', String(BATCH_SIZE))
                    url.searchParams.append('offset', String(offset))
                    url.searchParams.append('translatedLanguage[]', 'en')
                    // Order doesn't matter since we sort manually, but asc is better for paginating
                    url.searchParams.append('order[chapter]', 'asc')
                    url.searchParams.append('includeEmptyPages', '0')

                    const response = await fetch(url.toString())
                    const data = await response.json()

                    if (!data.data || data.data.length === 0) break

                    total = data.total ?? 0
                    allRaw = allRaw.concat(data.data)
                    offset += data.data.length

                    if (data.data.length < BATCH_SIZE) break
                }

                return allRaw.map((ch: any) => ({
                    id: ch.id,
                    number: parseFloat(ch.attributes.chapter || '0'),
                    title: ch.attributes.title || `Chapter ${ch.attributes.chapter || '?'}`,
                    pages: ch.attributes.pages || 0,
                    releasedAt: ch.attributes.publishAt || ch.attributes.createdAt || new Date().toISOString(),
                    isRead: false,
                    source: 'mangadex',
                }))
            } catch (err: any) {
                console.warn(`[Chapters] MangaDex fetch failed: ${err?.message}`)
                return []
            }
        }

        // --- Execute both fetches in Parallel ---
        console.time(`[Chapters] Fetched sources in parallel for ${id}`)

        const [wbcChapters, mdxChapters] = await Promise.all([
            fetchWeebCentralChapters(),
            fetchMangaDexChapters()
        ])

        console.timeEnd(`[Chapters] Fetched sources in parallel for ${id}`)
        console.log(`[Chapters] WeebCentral chapters: ${wbcChapters.length}, MangaDex chapters: ${mdxChapters.length}`)

        // --- Merge and Deduplicate ---
        // Combine them putting WeebCentral chapters FIRST, so dedup() keeps them over MangaDex if numbers are equal
        const combined = [...wbcChapters, ...mdxChapters]
        const unique = dedup(combined)

        // Sort according to requested order
        unique.sort((a, b) => {
            if (order === 'asc') return a.number - b.number
            return b.number - a.number
        })

        res.json({ data: unique, total: unique.length })
    } catch (error) {
        console.error('Chapters error:', error)
        res.status(500).json({ error: 'Failed to get chapters' })
    }
})

/**
 * GET /api/manga/chapter/pages?id=<chapterId>
 * Get page image URLs. Uses query param to avoid URL encoding issues with slashed IDs.
 */
router.get('/chapter/pages', async (req: Request, res: Response) => {
    const chapterId = req.query.id as string
    if (!chapterId) { res.status(400).json({ error: 'Missing id param' }); return }
    await serveChapterPages(chapterId, req, res)
})

/**
 * GET /api/manga/chapter/:chapterId/pages  (legacy path-param route)
 */
router.get('/chapter/:chapterId/pages', async (req: Request, res: Response) => {
    await serveChapterPages(req.params.chapterId, req, res)
})

async function serveChapterPages(chapterId: string, req: Request, res: Response) {
    try {
        // --- WeebCentral chapter (wbc: prefix) ---
        if (chapterId.startsWith('wbc:')) {
            const wbcId = chapterId.slice(4)
            console.log('[Pages] WeebCentral chapter:', wbcId)
            const wbcPages = await weebCentral.fetchChapterPages(wbcId)
            console.log('[Pages] WeebCentral returned', wbcPages.length, 'pages')
            const pages = wbcPages.map((p: any, i: number) => ({
                index: i + 1,
                url: p.img || p.url || '',
                hdUrl: p.img || p.url || null,
            }))
            res.json({ data: pages, total: pages.length })
            return
        }

        // --- MangaDex chapter (UUID) ---
        const response = await fetch(`${MANGADEX_API}/at-home/server/${chapterId}`)
        const data = await response.json()

        if (!data.baseUrl || !data.chapter) {
            res.status(404).json({ error: 'Chapter not found' })
            return
        }

        const { baseUrl, chapter } = data
        const hash = chapter.hash
        const pages = (chapter.dataSaver || chapter.data || []).map((filename: string, index: number) => ({
            index: index + 1,
            url: `${baseUrl}/data-saver/${hash}/${filename}`,
            hdUrl: chapter.data?.[index] ? `${baseUrl}/data/${hash}/${chapter.data[index]}` : null,
        }))

        res.json({ data: pages, total: pages.length })
    } catch (error) {
        console.error('Chapter pages error:', error)
        res.status(500).json({ error: 'Failed to get chapter pages' })
    }
}

export default router
