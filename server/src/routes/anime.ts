import { Router, Request, Response } from 'express'
import { ANIME } from '@consumet/extensions'

const router = Router()
const hianime = new ANIME.Hianime()

/**
 * GET /api/anime/search?q=...
 */
router.get('/search', async (req: Request, res: Response) => {
    try {
        const { q = '' } = req.query
        if (!q) {
            res.status(400).json({ error: 'Missing search query' })
            return
        }
        const results = await hianime.search(q.toString())
        res.json({ data: results.results || [] })
    } catch (error: any) {
        console.error('Anime search error:', error.message)
        res.status(500).json({ error: 'Failed to search anime' })
    }
})

/**
 * GET /api/anime/popular
 */
router.get('/popular', async (_req: Request, res: Response) => {
    try {
        const results = await hianime.fetchTopAiring()
        res.json({ data: results.results || [] })
    } catch (error: any) {
        console.error('Anime popular error:', error.message)
        res.status(500).json({ error: 'Failed to get popular anime' })
    }
})

/**
 * GET /api/anime/info/:id
 */
router.get('/info/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const info = await hianime.fetchAnimeInfo(id)
        res.json({ data: info })
    } catch (error: any) {
        console.error('Anime info error:', error.message)
        res.status(500).json({ error: 'Failed to get anime info' })
    }
})

/**
 * GET /api/anime/watch/:episodeId
 */
router.get('/watch/:episodeId', async (req: Request, res: Response) => {
    try {
        const { episodeId } = req.params
        const sources = await hianime.fetchEpisodeSources(episodeId)
        res.json({ data: sources })
    } catch (error: any) {
        console.error('Anime watch error:', error.message)
        res.status(500).json({ error: 'Failed to get streaming links' })
    }
})

export default router
