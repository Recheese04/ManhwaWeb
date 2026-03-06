import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mangaRoutes from './routes/manga.js'
import userRoutes from './routes/user.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173',       // Vite dev server
        'http://localhost:4173',       // Vite preview
        'https://manhwaweb.vercel.app', // Production (update this)
    ],
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
