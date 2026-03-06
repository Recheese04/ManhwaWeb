import { Link } from 'react-router-dom'
import { Star, Eye, BookOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Manga } from '@/lib/types'
import { formatViews } from '@/lib/mockData'

interface MangaCardProps {
    manga: Manga
    rank?: number
    className?: string
    variant?: 'default' | 'compact' | 'wide'
}

export default function MangaCard({ manga, rank, className, variant = 'default' }: MangaCardProps) {
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
                        src={manga.cover}
                        alt={manga.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                </div>
                <div className="flex-1 min-w-0 py-0.5">
                    <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">{manga.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Ch. {manga.chapters[0]?.number}</p>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-xs text-amber-500">
                            <Star className="w-3 h-3 fill-amber-500" />
                            {manga.rating}
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">{manga.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{manga.genres.slice(0, 3).join(' · ')}</p>
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
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2 shadow-md">
                    <img
                        src={manga.cover}
                        alt={manga.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <h3 className="font-medium text-sm line-clamp-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">{manga.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Ch. {manga.chapters[0]?.number}</p>
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
                    src={manga.cover}
                    alt={manga.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                {/* Ranking badge */}
                {rank !== undefined && (
                    <div className="absolute top-2 left-2 w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white text-sm font-bold shadow-lg">
                        {rank}
                    </div>
                )}

                {/* Type badge */}
                <Badge variant="glass" className="absolute top-2 right-2 text-[10px] capitalize">
                    {manga.type}
                </Badge>

                {/* Status badge */}
                <Badge
                    variant={manga.status === 'completed' ? 'success' : 'info'}
                    className="absolute top-10 right-2 text-[10px] capitalize"
                >
                    {manga.status}
                </Badge>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-sky-900/70 dark:bg-sky-950/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-white font-medium text-sm gradient-primary px-4 py-2 rounded-lg shadow-lg">
                        <BookOpen className="w-4 h-4" />
                        Read Now
                    </div>
                </div>

                {/* Bottom info */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="font-semibold text-sm line-clamp-2 text-white leading-tight">{manga.title}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                        <span className="flex items-center gap-1 text-xs text-amber-400">
                            <Star className="w-3 h-3 fill-amber-400" />
                            {manga.rating}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-white/60">
                            <Eye className="w-3 h-3" />
                            {formatViews(manga.views)}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    )
}
