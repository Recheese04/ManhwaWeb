import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { Readable } from 'stream'
import mangaRoutes from './routes/manga.js'
import userRoutes from './routes/user.js'
import animeRoutes from './routes/anime.js'

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

        // Allow localhost, vercel, and render domains
        if (allowedOrigins.includes(origin) ||
            origin.endsWith('.vercel.app') ||
            origin.endsWith('.onrender.com') ||
            origin.includes('recyglen')) {
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
// Stream proxy – fetches video/audio streams server‑side to avoid CORS & hotlink blocks
app.get('/api/stream-proxy', async (req: express.Request, res: express.Response) => {
    const { url } = req.query as { url?: string }
    if (!url) {
        res.status(400).json({ error: 'Missing url parameter' })
        return
    }
    try {
        const upstream = await fetch(url, {
            headers: {
                // Some providers require a referer or user‑agent
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            },
        })

        if (!upstream.ok) {
            console.error(`Stream proxy: Upstream returned ${upstream.status} for ${url}`)
            res.status(upstream.status).json({ error: `Upstream error: ${upstream.status}` })
            return
        }

        const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
        // If this is an HLS playlist, rewrite relative URLs and add cache control
        if (contentType.includes('application/vnd.apple.mpegurl') || url.endsWith('.m3u8')) {
            const text = await upstream.text();
            const base = new URL(url);
            const rewritten = text
                .split('\n')
                .map(line => {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed.startsWith('#') || /^https?:\/\//i.test(trimmed)) {
                        return line;
                    }
                    const absolute = new URL(trimmed, base).toString();
                    return `/api/stream-proxy?url=${encodeURIComponent(absolute)}`;
                })
                .join('\n');
            res.setHeader('Content-Type', contentType);
            // Cache playlist for 10 minutes (clients often re‑request it quickly)
            res.setHeader('Cache-Control', 'public, max-age=600');
            res.send(rewritten);
            return;
        }
        // Forward other headers – preserve upstream caching if present
        res.setHeader('Content-Type', contentType);
        const acceptRanges = upstream.headers.get('accept-ranges');
        if (acceptRanges) res.setHeader('Accept-Ranges', acceptRanges);
        const contentLength = upstream.headers.get('content-length');
        if (contentLength) res.setHeader('Content-Length', contentLength);
        const cacheControl = upstream.headers.get('cache-control');
        if (cacheControl) res.setHeader('Cache-Control', cacheControl);
        // Flush headers early to start streaming ASAP
        if (res.flushHeaders) res.flushHeaders();
        if (!upstream.body) {
            res.status(500).json({ error: 'Empty response body from source' });
            return;
        }
        const stream = Readable.from(upstream.body as any);
        stream.pipe(res);
    } catch (e: any) {
        console.error('Stream proxy error:', e.message)
        res.status(500).json({ error: e.message })
    }
})

// Existing routes
app.use('/api/manga', mangaRoutes)
app.use('/api/user', userRoutes)
app.use('/api/anime', animeRoutes)


/**
 * GET /api/img-proxy?url=<encoded-url>&ref=<encoded-referer>
 * Fetches an image server-side with the proper Referer header to bypass hotlink protection.
 * Used for MangaPill and other sources that block direct browser image requests.
 */
app.get('/api/img-proxy', async (req: express.Request, res: express.Response) => {
    const { url, ref } = req.query as { url?: string; ref?: string }
    if (!url) { res.status(400).json({ error: 'Missing url param' }); return }
    try {
        let referer = ref || 'https://mangapill.com/'
        if (!ref && url.includes('mangadex.org')) {
            referer = 'https://mangadex.org/'
        }

        const imgRes = await fetch(url, {
            headers: {
                'Referer': referer,
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

// Export for Vercel
export default app

// Start server (only if not in Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT as number, '0.0.0.0', () => {
        console.log(`
╔══════════════════════════════════════════╗
║     ManhwaWeb API Server                 ║
║     Running on http://0.0.0.0:${PORT}        ║
╚══════════════════════════════════════════╝
  `)
    })
}
