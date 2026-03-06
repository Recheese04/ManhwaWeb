import { Request, Response, NextFunction } from 'express'
import { auth } from '../config/firebase.js'

// Extend Express Request to include user info
declare global {
    namespace Express {
        interface Request {
            user?: {
                uid: string
                email?: string
            }
        }
    }
}

/**
 * Middleware: Require Firebase authentication
 * Validates the Bearer token from the Authorization header
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (!auth) {
        res.status(503).json({ error: 'Authentication service not configured' })
        return
    }

    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid authorization header' })
        return
    }

    const token = authHeader.split('Bearer ')[1]
    if (!token) {
        res.status(401).json({ error: 'Missing token' })
        return
    }

    try {
        const decoded = await auth.verifyIdToken(token)
        req.user = { uid: decoded.uid, email: decoded.email }
        next()
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' })
    }
}

/**
 * Middleware: Optional auth — sets req.user if valid token, but doesn't block
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
    if (!auth) {
        next()
        return
    }

    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split('Bearer ')[1]
        if (token) {
            try {
                const decoded = await auth.verifyIdToken(token)
                req.user = { uid: decoded.uid, email: decoded.email }
            } catch {
                // Token invalid, continue without user
            }
        }
    }
    next()
}
