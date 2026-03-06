import { Router, Request, Response } from 'express'
import { db } from '../config/firebase.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

/**
 * GET /api/user/profile
 * Get authenticated user's profile from Firestore
 */
router.get('/profile', requireAuth, async (req: Request, res: Response) => {
    try {
        if (!db) {
            res.status(503).json({ error: 'Database not configured' })
            return
        }

        const userDoc = await db.collection('users').doc(req.user!.uid).get()

        if (!userDoc.exists) {
            // Create default profile
            const defaultProfile = {
                uid: req.user!.uid,
                email: req.user!.email,
                username: req.user!.email?.split('@')[0] || 'User',
                avatar: `https://placehold.co/100x100/0ea5e9/ffffff?text=${(req.user!.email?.[0] || 'U').toUpperCase()}`,
                bookmarks: [],
                favorites: [],
                readingHistory: [],
                createdAt: new Date().toISOString(),
            }
            await db.collection('users').doc(req.user!.uid).set(defaultProfile)
            res.json({ data: defaultProfile })
            return
        }

        res.json({ data: userDoc.data() })
    } catch (error) {
        console.error('Profile error:', error)
        res.status(500).json({ error: 'Failed to get profile' })
    }
})

/**
 * PUT /api/user/profile
 * Update user profile
 */
router.put('/profile', requireAuth, async (req: Request, res: Response) => {
    try {
        if (!db) {
            res.status(503).json({ error: 'Database not configured' })
            return
        }

        const { username, avatar } = req.body
        const updates: Record<string, any> = { updatedAt: new Date().toISOString() }
        if (username) updates.username = username
        if (avatar) updates.avatar = avatar

        await db.collection('users').doc(req.user!.uid).update(updates)
        res.json({ success: true })
    } catch (error) {
        console.error('Update profile error:', error)
        res.status(500).json({ error: 'Failed to update profile' })
    }
})

/**
 * POST /api/user/bookmark/:mangaId
 * Add a manga to bookmarks
 */
router.post('/bookmark/:mangaId', requireAuth, async (req: Request, res: Response) => {
    try {
        if (!db) {
            res.status(503).json({ error: 'Database not configured' })
            return
        }

        const { mangaId } = req.params
        const userRef = db.collection('users').doc(req.user!.uid)
        const userDoc = await userRef.get()

        if (!userDoc.exists) {
            res.status(404).json({ error: 'User not found' })
            return
        }

        const bookmarks: string[] = userDoc.data()?.bookmarks || []
        if (!bookmarks.includes(mangaId)) {
            bookmarks.push(mangaId)
            await userRef.update({ bookmarks })
        }

        res.json({ success: true, bookmarks })
    } catch (error) {
        console.error('Bookmark error:', error)
        res.status(500).json({ error: 'Failed to bookmark' })
    }
})

/**
 * DELETE /api/user/bookmark/:mangaId
 * Remove a manga from bookmarks
 */
router.delete('/bookmark/:mangaId', requireAuth, async (req: Request, res: Response) => {
    try {
        if (!db) {
            res.status(503).json({ error: 'Database not configured' })
            return
        }

        const { mangaId } = req.params
        const userRef = db.collection('users').doc(req.user!.uid)
        const userDoc = await userRef.get()

        if (!userDoc.exists) {
            res.status(404).json({ error: 'User not found' })
            return
        }

        const bookmarks: string[] = (userDoc.data()?.bookmarks || []).filter((id: string) => id !== mangaId)
        await userRef.update({ bookmarks })

        res.json({ success: true, bookmarks })
    } catch (error) {
        console.error('Remove bookmark error:', error)
        res.status(500).json({ error: 'Failed to remove bookmark' })
    }
})

/**
 * POST /api/user/favorite/:mangaId
 * Add a manga to favorites
 */
router.post('/favorite/:mangaId', requireAuth, async (req: Request, res: Response) => {
    try {
        if (!db) {
            res.status(503).json({ error: 'Database not configured' })
            return
        }

        const { mangaId } = req.params
        const userRef = db.collection('users').doc(req.user!.uid)
        const userDoc = await userRef.get()

        if (!userDoc.exists) {
            res.status(404).json({ error: 'User not found' })
            return
        }

        const favorites: string[] = userDoc.data()?.favorites || []
        if (!favorites.includes(mangaId)) {
            favorites.push(mangaId)
            await userRef.update({ favorites })
        }

        res.json({ success: true, favorites })
    } catch (error) {
        console.error('Favorite error:', error)
        res.status(500).json({ error: 'Failed to favorite' })
    }
})

/**
 * DELETE /api/user/favorite/:mangaId
 */
router.delete('/favorite/:mangaId', requireAuth, async (req: Request, res: Response) => {
    try {
        if (!db) {
            res.status(503).json({ error: 'Database not configured' })
            return
        }

        const { mangaId } = req.params
        const userRef = db.collection('users').doc(req.user!.uid)
        const userDoc = await userRef.get()

        if (!userDoc.exists) {
            res.status(404).json({ error: 'User not found' })
            return
        }

        const favorites: string[] = (userDoc.data()?.favorites || []).filter((id: string) => id !== mangaId)
        await userRef.update({ favorites })

        res.json({ success: true, favorites })
    } catch (error) {
        console.error('Remove favorite error:', error)
        res.status(500).json({ error: 'Failed to remove favorite' })
    }
})

/**
 * POST /api/user/reading-history
 * Track reading progress
 */
router.post('/reading-history', requireAuth, async (req: Request, res: Response) => {
    try {
        if (!db) {
            res.status(503).json({ error: 'Database not configured' })
            return
        }

        const { mangaId, chapterId, chapterNumber, progress } = req.body
        const userRef = db.collection('users').doc(req.user!.uid)
        const userDoc = await userRef.get()

        if (!userDoc.exists) {
            res.status(404).json({ error: 'User not found' })
            return
        }

        const history: any[] = userDoc.data()?.readingHistory || []
        const existingIndex = history.findIndex((h: any) => h.mangaId === mangaId)

        const entry = {
            mangaId,
            chapterId,
            chapterNumber,
            progress: progress || 0,
            lastReadAt: new Date().toISOString(),
        }

        if (existingIndex >= 0) {
            history[existingIndex] = entry
        } else {
            history.unshift(entry)
        }

        // Keep only last 50 entries
        const trimmed = history.slice(0, 50)
        await userRef.update({ readingHistory: trimmed })

        res.json({ success: true })
    } catch (error) {
        console.error('Reading history error:', error)
        res.status(500).json({ error: 'Failed to update reading history' })
    }
})

export default router
