import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mangaRoutes from './routes/manga.js'
import userRoutes from './routes/user.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:4173'
]

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true)

        // Allow localhost and vercel domains
        if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.includes('recyglen')) {
            return callback(null, true)
        }

        callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
}))
app.use(express.json())

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/manga', mangaRoutes)
app.use('/api/user', userRoutes)

/**
 * GET /api/img-proxy?url=<encoded-url>&ref=<encoded-referer>
 * Fetches an image server-side with the proper Referer header to bypass hotlink protection.
 * Used for MangaPill and other sources that block direct browser image requests.
 */
app.get('/api/img-proxy', async (req: express.Request, res: express.Response) => {
    const { url, ref } = req.query as { url?: string; ref?: string }
    if (!url) { res.status(400).json({ error: 'Missing url param' }); return }
    try {
        const imgRes = await fetch(url, {
            headers: {
                'Referer': ref || 'https://mangapill.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'image/webp,image/apng,image/*,*/*',
            }
        })

        // MangaDex returns 404 WITH a placeholder image for licensed/removed covers
        if (!imgRes.ok) {
            if (imgRes.status === 404 && url.includes('mangadex.org/covers')) {
                res.redirect('https://placehold.co/300x400/1a1a2e/38bdf8?text=No+Cover')
                return
            }
            res.status(imgRes.status).end()
            return
        }
        res.set('Content-Type', imgRes.headers.get('content-type') || 'image/jpeg')
        res.set('Cache-Control', 'public, max-age=86400') // cache 24h
        const buf = await imgRes.arrayBuffer()
        res.send(Buffer.from(buf))
    } catch (e: any) {
        res.status(500).json({ error: e.message })
    }
})

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error:', err.message)
    res.status(500).json({ error: 'Internal server error' })
})

// Start server
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║     ManhwaWeb API Server                 ║
║     Running on http://localhost:${PORT}      ║
╚══════════════════════════════════════════╝
  `)
    console.log('Routes:')
    console.log('  GET  /api/health')
    console.log('  GET  /api/manga/search?q=...')
    console.log('  GET  /api/manga/popular')
    console.log('  GET  /api/manga/latest')
    console.log('  GET  /api/manga/:id')
    console.log('  GET  /api/manga/:id/chapters')
    console.log('  GET  /api/manga/chapter/:id/pages')
    console.log('  GET  /api/user/profile         (auth)')
    console.log('  POST /api/user/bookmark/:id     (auth)')
    console.log('  POST /api/user/favorite/:id     (auth)')
    console.log('  POST /api/user/reading-history  (auth)')
})
