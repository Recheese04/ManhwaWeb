import { firebaseAuth } from './firebase'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

interface ApiOptions {
    auth?: boolean
    method?: string
    body?: any
}

/**
 * Base API fetch with optional Firebase auth token
 */
async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
    const { auth = false, method = 'GET', body } = options

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    }

    if (auth && firebaseAuth.currentUser) {
        const token = await firebaseAuth.currentUser.getIdToken()
        headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(error.error || `API error: ${response.status}`)
    }

    return response.json()
}

// ============ MANGA ENDPOINTS ============

export interface ApiManga {
    id: string
    title: string
    slug: string
    altTitles: string[]
    cover: string
    banner: string | null
    type: 'manga' | 'manhwa' | 'manhua'
    status: 'ongoing' | 'completed' | 'hiatus'
    rating: number
    views: number
    bookmarks: number
    synopsis: string
    author: string
    artist: string
    genres: string[]
    latestChapter?: string | null
    createdAt: string
    updatedAt: string
}

export interface ApiChapter {
    id: string
    number: number
    title: string
    pages: number
    releasedAt: string
    isRead: boolean
}

export interface ApiPage {
    index: number
    url: string
    hdUrl: string | null
}

export interface PaginatedResponse<T> {
    data: T[]
    total: number
    limit?: number
    offset?: number
}

/** Search manga by title */
export async function searchManga(
    query: string,
    options?: { type?: string; status?: string; limit?: number; offset?: number }
): Promise<PaginatedResponse<ApiManga>> {
    const params = new URLSearchParams()
    if (query) params.append('q', query)
    if (options?.type) params.append('type', options.type)
    if (options?.status) params.append('status', options.status)
    if (options?.limit) params.append('limit', String(options.limit))
    if (options?.offset) params.append('offset', String(options.offset))
    return apiFetch(`/manga/search?${params.toString()}`)
}

/** Get popular/trending manga */
export async function getPopularManga(): Promise<PaginatedResponse<ApiManga>> {
    return apiFetch('/manga/popular')
}

/** Get recently updated manga */
export async function getLatestManga(): Promise<PaginatedResponse<ApiManga>> {
    return apiFetch('/manga/latest')
}

/** Get manga details by ID */
export async function getMangaDetails(id: string): Promise<{ data: ApiManga }> {
    return apiFetch(`/manga/${id}`)
}

/** Get chapters for a manga */
export async function getMangaChapters(
    id: string,
    options?: { limit?: number; offset?: number; order?: 'asc' | 'desc' }
): Promise<PaginatedResponse<ApiChapter>> {
    const params = new URLSearchParams()
    if (options?.limit) params.append('limit', String(options.limit))
    if (options?.offset) params.append('offset', String(options.offset))
    if (options?.order) params.append('order', options.order)
    return apiFetch(`/manga/${id}/chapters?${params.toString()}`)
}

/** Get page image URLs for a chapter */
export async function getChapterPages(chapterId: string): Promise<PaginatedResponse<ApiPage>> {
    return apiFetch(`/manga/chapter/${chapterId}/pages`)
}

// ============ USER ENDPOINTS (AUTH REQUIRED) ============

export interface UserProfile {
    uid: string
    email: string
    username: string
    avatar: string
    bookmarks: string[]
    favorites: string[]
    readingHistory: ReadingHistoryEntry[]
}

export interface ReadingHistoryEntry {
    mangaId: string
    chapterId: string
    chapterNumber: number
    progress: number
    lastReadAt: string
}

/** Get user profile */
export async function getUserProfile(): Promise<{ data: UserProfile }> {
    return apiFetch('/user/profile', { auth: true })
}

/** Update user profile */
export async function updateUserProfile(data: { username?: string; avatar?: string }): Promise<{ success: boolean }> {
    return apiFetch('/user/profile', { auth: true, method: 'PUT', body: data })
}

/** Add bookmark */
export async function addBookmark(mangaId: string): Promise<{ success: boolean; bookmarks: string[] }> {
    return apiFetch(`/user/bookmark/${mangaId}`, { auth: true, method: 'POST' })
}

/** Remove bookmark */
export async function removeBookmark(mangaId: string): Promise<{ success: boolean; bookmarks: string[] }> {
    return apiFetch(`/user/bookmark/${mangaId}`, { auth: true, method: 'DELETE' })
}

/** Add favorite */
export async function addFavorite(mangaId: string): Promise<{ success: boolean; favorites: string[] }> {
    return apiFetch(`/user/favorite/${mangaId}`, { auth: true, method: 'POST' })
}

/** Remove favorite */
export async function removeFavorite(mangaId: string): Promise<{ success: boolean; favorites: string[] }> {
    return apiFetch(`/user/favorite/${mangaId}`, { auth: true, method: 'DELETE' })
}

/** Track reading progress */
export async function trackReading(data: {
    mangaId: string
    chapterId: string
    chapterNumber: number
    progress: number
}): Promise<{ success: boolean }> {
    return apiFetch('/user/reading-history', { auth: true, method: 'POST', body: data })
}
