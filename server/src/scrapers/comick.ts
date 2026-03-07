/**
 * ComicK.io API integration
 * Free public API that has ALL chapters including licensed titles.
 * No Cloudflare, no scraping - pure JSON REST API.
 */

const COMICK_API = 'https://api.comick.io'

export interface ComickChapter {
    id: string          // 'cmk:{chapter_hid}'
    number: number
    title: string
    pages: number
    releasedAt: string
}

export interface ComickPage {
    index: number
    url: string
    hdUrl: string
}

/** Search ComicK for a manga by title. Returns the best match's HID. */
async function searchComick(title: string): Promise<{ hid: string; title: string } | null> {
    const url = new URL(`${COMICK_API}/v1.0/search`)
    url.searchParams.set('q', title)
    url.searchParams.set('type', 'comic')
    url.searchParams.set('limit', '5')

    const res = await fetch(url.toString(), {
        headers: { 'User-Agent': 'ManhwaWeb/1.0' }
    })
    if (!res.ok) throw new Error(`ComicK search failed: ${res.status}`)

    const results: any[] = await res.json()
    if (!results || results.length === 0) return null

    return { hid: results[0].hid, title: results[0].title }
}

/**
 * Fetch ALL English chapters for a manga from ComicK by title.
 * Paginates automatically until all chapters are collected.
 */
export async function getComickChapters(mangaTitle: string, orderAsc = true): Promise<ComickChapter[]> {
    const match = await searchComick(mangaTitle)
    if (!match) throw new Error(`No results on ComicK for: ${mangaTitle}`)

    console.log(`[ComicK] Found: "${match.title}" (hid: ${match.hid})`)

    const allChapters: any[] = []
    let page = 1
    const limit = 300 // ComicK max per page

    while (true) {
        const url = new URL(`${COMICK_API}/comic/${match.hid}/chapters`)
        url.searchParams.set('lang', 'en')
        url.searchParams.set('limit', String(limit))
        url.searchParams.set('page', String(page))
        url.searchParams.set('chap-order', orderAsc ? '1' : '0')

        const res = await fetch(url.toString(), {
            headers: { 'User-Agent': 'ManhwaWeb/1.0' }
        })
        if (!res.ok) break

        const data = await res.json()
        const chapters: any[] = data.chapters || []
        if (chapters.length === 0) break

        allChapters.push(...chapters)
        if (chapters.length < limit) break
        page++
    }

    // If no English chapters found, try without language filter (any language)
    if (allChapters.length === 0) {
        console.log('[ComicK] No English chapters, trying all languages...')
        const url = new URL(`${COMICK_API}/comic/${match.hid}/chapters`)
        url.searchParams.set('limit', '300')
        url.searchParams.set('chap-order', orderAsc ? '1' : '0')
        const res = await fetch(url.toString(), { headers: { 'User-Agent': 'ManhwaWeb/1.0' } })
        if (res.ok) {
            const data = await res.json()
            allChapters.push(...(data.chapters || []))
        }
    }

    console.log(`[ComicK] Got ${allChapters.length} chapters for "${mangaTitle}"`)

    // Deduplicate by chapter number, keep first occurrence
    const seen = new Set<number>()
    return allChapters
        .map((ch: any) => {
            const num = parseFloat(ch.chap || '0')
            return {
                id: `cmk:${ch.hid}`,
                number: isNaN(num) ? 0 : num,
                title: ch.title || `Chapter ${ch.chap || '?'}`,
                pages: ch.page_count || 0,
                releasedAt: ch.publish_at || new Date().toISOString(),
            }
        })
        .filter((ch) => {
            if (seen.has(ch.number)) return false
            seen.add(ch.number)
            return true
        })
}

/**
 * Fetch page image URLs for a ComicK chapter.
 * @param chapterHid  The chapter HID (strip the 'cmk:' prefix before passing)
 */
export async function getComickPages(chapterHid: string): Promise<ComickPage[]> {
    const url = `${COMICK_API}/chapter/${chapterHid}`
    const res = await fetch(url, { headers: { 'User-Agent': 'ManhwaWeb/1.0' } })
    if (!res.ok) throw new Error(`ComicK chapter fetch failed: ${res.status}`)

    const data = await res.json()
    const images: any[] = data.chapter?.images || data.chapter?.md_images || []

    return images.map((img: any, i: number) => {
        // ComicK images come as { url } or as { b2key } accessed via CDN
        const imgUrl = img.url || (img.b2key ? `https://meo.comick.pictures/${img.b2key}` : '')
        return {
            index: i + 1,
            url: imgUrl,
            hdUrl: imgUrl,
        }
    }).filter(p => p.url)
}
