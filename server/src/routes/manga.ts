import { Router, Request, Response } from 'express'

const router = Router()
const MANGADEX_API = 'https://api.mangadex.org'

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
function getCoverUrl(manga: any): string | null {
    const coverRel = manga.relationships?.find((r: any) => r.type === 'cover_art')
    if (coverRel?.attributes?.fileName) {
        return `https://uploads.mangadex.org/covers/${manga.id}/${coverRel.attributes.fileName}.512.jpg`
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

/**
 * GET /api/manga/search
 * Search for manga by title
 */
router.get('/search', async (req: Request, res: Response) => {
    try {
        const { q = '', limit = '20', offset = '0', type, status, genre } = req.query

        const params: Record<string, string> = {
            'limit': String(limit),
            'offset': String(offset),
            'includes[]': 'cover_art',
            'order[followedCount]': 'desc',
            'contentRating[]': 'safe',
        }

        if (q) params['title'] = String(q)
        if (status) params['status[]'] = String(status)

        // Add genre/tag filter
        if (genre) {
            // MangaDex uses tag UUIDs, so we'll do name-based filtering in the results
            params['includedTagsMode'] = 'AND'
        }

        // Filter by original language for type
        if (type === 'manhwa') params['originalLanguage[]'] = 'ko'
        else if (type === 'manhua') params['originalLanguage[]'] = 'zh'
        else if (type === 'manga') params['originalLanguage[]'] = 'ja'

        // Need to handle includes[] specially
        const url = new URL(`${MANGADEX_API}/manga`)
        url.searchParams.append('limit', params.limit)
        url.searchParams.append('offset', params.offset)
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
 * Get chapters for a manga
 */
router.get('/:id/chapters', async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const { limit = '100', offset = '0', order = 'desc' } = req.query

        const url = new URL(`${MANGADEX_API}/manga/${id}/feed`)
        url.searchParams.append('limit', String(limit))
        url.searchParams.append('offset', String(offset))
        url.searchParams.append('translatedLanguage[]', 'en')
        url.searchParams.append('order[chapter]', String(order))
        url.searchParams.append('includeEmptyPages', '0')

        const response = await fetch(url.toString())
        const data = await response.json()

        const chapters = (data.data || []).map((ch: any) => ({
            id: ch.id,
            number: parseFloat(ch.attributes.chapter || '0'),
            title: ch.attributes.title || `Chapter ${ch.attributes.chapter || '?'}`,
            pages: ch.attributes.pages || 0,
            releasedAt: ch.attributes.publishAt || ch.attributes.createdAt || new Date().toISOString(),
            isRead: false,
        }))

        // Remove duplicates (keep first occurrence of each chapter number)
        const seen = new Set<number>()
        const uniqueChapters = chapters.filter((ch: any) => {
            if (seen.has(ch.number)) return false
            seen.add(ch.number)
            return true
        })

        res.json({
            data: uniqueChapters,
            total: data.total || 0,
        })
    } catch (error) {
        console.error('Chapters error:', error)
        res.status(500).json({ error: 'Failed to get chapters' })
    }
})

/**
 * GET /api/manga/chapter/:chapterId/pages
 * Get page image URLs for a chapter
 */
router.get('/chapter/:chapterId/pages', async (req: Request, res: Response) => {
    try {
        const { chapterId } = req.params

        const response = await fetch(`${MANGADEX_API}/at-home/server/${chapterId}`)
        const data = await response.json()

        if (!data.baseUrl || !data.chapter) {
            res.status(404).json({ error: 'Chapter not found' })
            return
        }

        const { baseUrl, chapter } = data
        const hash = chapter.hash

        // Use data-saver images for faster loading
        const pages = (chapter.dataSaver || chapter.data || []).map((filename: string, index: number) => ({
            index: index + 1,
            url: `${baseUrl}/data-saver/${hash}/${filename}`,
            hdUrl: chapter.data?.[index] ? `${baseUrl}/data/${hash}/${chapter.data[index]}` : null,
        }))

        res.json({
            data: pages,
            total: pages.length,
        })
    } catch (error) {
        console.error('Chapter pages error:', error)
        res.status(500).json({ error: 'Failed to get chapter pages' })
    }
})

export default router
