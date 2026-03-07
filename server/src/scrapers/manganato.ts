/**
 * Manganato scraper using Playwright + stealth plugin to bypass Cloudflare.
 * Used as fallback when MangaDex has no English chapters for a manga.
 */
import { chromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

// Register stealth plugin once
chromium.use(StealthPlugin())

export interface ScrapedChapter {
    id: string          // Full chapter URL (used as chapter ID)
    number: number
    title: string
    releasedAt: string
}

/** Format a title for Manganato search (lowercase, spaces → underscores, strip punctuation) */
function toManganatoQuery(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '_')
}

/**
 * Search Manganato for a manga by title and return all its chapters.
 * Launches a stealth Chromium browser to bypass Cloudflare.
 */
export async function getManganatoChapters(title: string): Promise<ScrapedChapter[]> {
    const browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        locale: 'en-US',
        timezoneId: 'America/New_York',
        viewport: { width: 1280, height: 800 },
    })

    try {
        const page = await context.newPage()

        // Block images/fonts/css to speed up scraping
        await page.route('**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,otf}', r => r.abort())

        // --- Step 1: Search ---
        const query = toManganatoQuery(title)
        const searchUrl = `https://manganato.com/search/story/${query}`
        console.log(`[Manganato] Searching: ${searchUrl}`)

        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 })
        await page.waitForTimeout(2000)

        // Extract first result URL
        const mangaUrl = await page.evaluate(() => {
            const link = document.querySelector('.search-story-item a.item-img') as HTMLAnchorElement
            return link?.href || null
        })

        if (!mangaUrl) {
            console.log('[Manganato] No search results found')
            return []
        }
        console.log(`[Manganato] Found manga: ${mangaUrl}`)

        // --- Step 2: Get manga page with chapter list ---
        await page.goto(mangaUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 })
        await page.waitForTimeout(2000)

        // Extract chapters from .chapter-name links
        const chapters = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('.row-content-chapter li'))
            return rows.map((row) => {
                const link = row.querySelector('a.chapter-name') as HTMLAnchorElement
                const dateEl = row.querySelector('.chapter-time') as HTMLElement
                if (!link) return null

                const href = link.href
                const text = link.textContent?.trim() || ''

                // Extract chapter number from text like "Chapter 179" or from URL
                const numMatch = text.match(/Chapter\s+([\d.]+)/i) || href.match(/chapter[_-]([\d.]+)/i)
                const number = numMatch ? parseFloat(numMatch[1]) : 0

                return {
                    id: href,
                    number,
                    title: text || `Chapter ${number}`,
                    releasedAt: dateEl?.getAttribute('title') || dateEl?.textContent?.trim() || new Date().toISOString(),
                }
            }).filter(Boolean)
        })

        console.log(`[Manganato] Found ${chapters.length} chapters for "${title}"`)
        return chapters as ScrapedChapter[]

    } finally {
        await browser.close()
    }
}

/**
 * Fetch page image URLs for a Manganato chapter URL.
 */
export async function getManganatoPages(chapterUrl: string): Promise<{ index: number; url: string; hdUrl: string }[]> {
    const browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        locale: 'en-US',
        viewport: { width: 1280, height: 800 },
    })

    try {
        const page = await context.newPage()

        // Block non-essential resources except images (we need image URLs)
        await page.route('**/*.{woff,woff2,ttf,otf,css}', r => r.abort())

        await page.goto(chapterUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 })
        await page.waitForTimeout(2000)

        const images = await page.evaluate(() => {
            const imgs = Array.from(document.querySelectorAll('.container-chapter-reader img')) as HTMLImageElement[]
            return imgs.map((img, i) => ({
                index: i + 1,
                url: img.src || img.getAttribute('data-src') || '',
                hdUrl: img.src || img.getAttribute('data-src') || '',
            })).filter(p => p.url)
        })

        console.log(`[Manganato] Got ${images.length} pages for chapter: ${chapterUrl}`)
        return images

    } finally {
        await browser.close()
    }
}
