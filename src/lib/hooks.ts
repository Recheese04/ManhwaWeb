import { useState, useEffect, useCallback } from 'react'
import {
    searchManga,
    getPopularManga,
    getLatestManga,
    getMangaDetails,
    getMangaChapters,
    getChapterPages,
    type ApiManga,
    type ApiChapter,
    type ApiPage,
} from './api'

/** Hook: Fetch popular manga */
export function usePopularManga() {
    const [data, setData] = useState<ApiManga[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        getPopularManga()
            .then(res => { if (!cancelled) setData(res.data) })
            .catch(err => { if (!cancelled) setError(err.message) })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [])

    return { data, loading, error }
}

/** Hook: Fetch latest updated manga */
export function useLatestManga() {
    const [data, setData] = useState<ApiManga[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        getLatestManga()
            .then(res => { if (!cancelled) setData(res.data) })
            .catch(err => { if (!cancelled) setError(err.message) })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [])

    return { data, loading, error }
}

/** Hook: Search manga */
export function useSearchManga(
    query: string,
    options?: { type?: string; status?: string; limit?: number; offset?: number }
) {
    const [data, setData] = useState<ApiManga[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const search = useCallback(async (q: string, opts?: typeof options) => {
        setLoading(true)
        setError(null)
        try {
            const res = await searchManga(q, opts)
            setData(res.data)
            setTotal(res.total)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        search(query, options)
    }, [query, options?.type, options?.status, options?.limit, options?.offset])

    return { data, total, loading, error, search }
}

/** Hook: Get manga details */
export function useMangaDetails(id: string | undefined) {
    const [data, setData] = useState<ApiManga | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!id) return
        let cancelled = false
        setLoading(true)
        getMangaDetails(id)
            .then(res => { if (!cancelled) setData(res.data) })
            .catch(err => { if (!cancelled) setError(err.message) })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [id])

    return { data, loading, error }
}

/** Hook: Get manga chapters */
export function useMangaChapters(id: string | undefined, options?: { order?: 'asc' | 'desc' }) {
    const [data, setData] = useState<ApiChapter[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!id) return
        let cancelled = false
        setLoading(true)
        getMangaChapters(id, { limit: 100, order: options?.order || 'desc' })
            .then(res => { if (!cancelled) { setData(res.data); setTotal(res.total) } })
            .catch(err => { if (!cancelled) setError(err.message) })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [id, options?.order])

    return { data, total, loading, error }
}

/** Hook: Get chapter page images */
export function useChapterPages(chapterId: string | undefined) {
    const [data, setData] = useState<ApiPage[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!chapterId) return
        let cancelled = false
        setLoading(true)
        getChapterPages(chapterId)
            .then(res => { if (!cancelled) setData(res.data) })
            .catch(err => { if (!cancelled) setError(err.message) })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [chapterId])

    return { data, loading, error }
}
