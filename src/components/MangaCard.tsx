import { Link } from 'react-router-dom'
import { Star, Eye, BookOpen, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface MangaData {
    id: string
    title: string
    slug: string
    cover: string
    type: string
    status: string
    rating: number
    views: number
    genres: string[]
    author?: string
    latestChapter?: string | null
    chapters?: any[]
}

interface MangaCardProps {
    manga: MangaData
    rank?: number
    className?: string
    variant?: 'default' | 'compact' | 'wide'
}

function formatViews(views: number): string {
    if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`
    if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`
    return String(views)
}

function formatChapter(chapterStr: string | null | undefined): string | null {
    if (!chapterStr) return null
    // If it's just a number like "15", return "Ch. 15"
    if (/^\d+(\.\d+)?$/.test(chapterStr)) return `Ch. ${chapterStr}`
    return chapterStr
}

function getCoverImageUrl(url: string): string {
    if (!url) return ''
    if (url.startsWith('/api')) {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
        // If VITE_API_URL already ends with /api, we map `/api/img-proxy` correctly
        // e.g. https://domain.com/api + /api/img-proxy -> https://domain.com/api/img-proxy
        // wait, VITE_API_URL is "https://manhwaweb.onrender.com/api"
        // so if url is "/api/img-proxy", we should replace "/api" with VITE_API_URL
        return url.replace('/api', baseUrl)
    }
    return url
}

export default function MangaCard({ manga, rank, className, variant = 'default' }: MangaCardProps) {
    const chapterText = formatChapter(manga.latestChapter)

    if (variant === 'wide') {
        return (
            <Link
                to={`/manga/${manga.slug}`}
                className={cn(
                    'group flex gap-4 p-3 rounded-xl border border-border bg-card hover:bg-muted hover:border-sky-200 dark:hover:border-sky-500/20 transition-all duration-300 shadow-sm',
                    className
                )}
            >
                <div className="relative w-20 h-28 rounded-lg overflow-hidden shrink-0">
                    <img
                        src={getCoverImageUrl(manga.cover)}
                        alt={manga.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                </div>
                <div className="flex-1 min-w-0 py-0.5">
                    <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">{manga.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{manga.author || 'Unknown'}</p>
                    <div className="flex items-center gap-3 mt-2">
                        {manga.rating > 0 && (
                            <span className="flex items-center gap-1 text-[10px] text-amber-500">
                                <Star className="w-3 h-3 fill-amber-500" />
                                {manga.rating}
                            </span>
                        )}
                        {chapterText && (
                            <span className="flex items-center gap-1 text-[10px] text-sky-600 dark:text-sky-400 font-medium">
                                <Clock className="w-3 h-3" />
                                {chapterText}
                            </span>
                        )}
                    </div>
                </div>
            </Link>
        )
    }

    if (variant === 'compact') {
        return (
            <Link
                to={`/manga/${manga.slug}`}
                className={cn('group block', className)}
            >
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2 shadow-sm border border-border/50">
                    <img
                        src={getCoverImageUrl(manga.cover)}
                        alt={manga.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {chapterText && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
                            <span className="text-[10px] font-medium text-white shadow-sm flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {chapterText}
                            </span>
                        </div>
                    )}
                </div>
                <h3 className="font-medium text-sm line-clamp-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">{manga.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 capitalize">{manga.type}</p>
            </Link>
        )
    }

    return (
        <Link
            to={`/manga/${manga.slug}`}
            className={cn('group relative block card-hover', className)}
        >
            <div className="relative aspect-[3/4.5] rounded-xl overflow-hidden shadow-md">
                <img
                    src={getCoverImageUrl(manga.cover)}
                    alt={manga.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                {rank !== undefined && (
                    <div className="absolute top-2 left-2 w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white text-sm font-bold shadow-lg z-10">
                        {rank}
                    </div>
                )}

                <Badge variant="glass" className="absolute top-2 right-2 text-[10px] capitalize z-10">
                    {manga.type}
                </Badge>

                {chapterText && (
                    <Badge variant="default" className="absolute top-10 right-2 text-[10px] bg-sky-500 hover:bg-sky-600 text-white z-10 transition-colors shadow-md border-0">
                        {chapterText}
                    </Badge>
                )}

                <div className="absolute inset-0 bg-sky-900/70 dark:bg-sky-950/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center z-20">
                    <div className="flex items-center gap-2 text-white font-medium text-sm gradient-primary px-4 py-2 rounded-lg shadow-lg">
                        <BookOpen className="w-4 h-4" />
                        Read Now
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                    <h3 className="font-semibold text-sm line-clamp-2 text-white leading-tight">{manga.title}</h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {manga.rating > 0 && (
                            <span className="flex items-center gap-1 text-[10px] text-amber-400">
                                <Star className="w-3 h-3 fill-amber-400" />
                                {manga.rating}
                            </span>
                        )}
                        {manga.views > 0 && (
                            <span className="flex items-center gap-1 text-[10px] text-white/60">
                                <Eye className="w-3 h-3" />
                                {formatViews(manga.views)}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    )
}
