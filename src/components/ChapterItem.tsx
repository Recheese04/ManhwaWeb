import { Link } from 'react-router-dom'
import { Eye, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Chapter } from '@/lib/types'
import { formatDate } from '@/lib/mockData'

interface ChapterItemProps {
    chapter: Chapter
    mangaSlug: string
    className?: string
}

export default function ChapterItem({ chapter, mangaSlug, className }: ChapterItemProps) {
    return (
        <Link
            to={`/manga/${mangaSlug}/chapter/${chapter.number}`}
            className={cn(
                'flex items-center justify-between gap-4 px-4 py-3 rounded-lg hover:bg-muted transition-colors group',
                chapter.isRead && 'opacity-50',
                className
            )}
        >
            <div className="flex items-center gap-3 min-w-0">
                <div className={cn(
                    'w-2 h-2 rounded-full shrink-0',
                    chapter.isRead ? 'bg-muted-foreground/30' : 'bg-sky-500'
                )} />
                <div className="min-w-0">
                    <p className="text-sm font-medium group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate">
                        Chapter {chapter.number}
                        {chapter.title && chapter.title !== `Chapter ${chapter.number}` && (
                            <span className="text-muted-foreground font-normal"> — {chapter.title}</span>
                        )}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatDate(chapter.releasedAt)}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Eye className="w-3 h-3" />
                            {chapter.pages} pages
                        </span>
                    </div>
                </div>
            </div>
            {chapter.isRead && (
                <Badge variant="outline" className="text-[10px] shrink-0">Read</Badge>
            )}
        </Link>
    )
}
