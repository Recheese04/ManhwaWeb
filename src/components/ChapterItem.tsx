import { Link } from 'react-router-dom'
import { Eye, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ChapterData {
    id: string
    number: number
    title: string
    pages: number
    releasedAt: string
    isRead?: boolean
}

interface ChapterItemProps {
    chapter: ChapterData
    mangaSlug: string
    className?: string
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days}d ago`
    if (days < 30) return `${Math.floor(days / 7)}w ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ChapterItem({ chapter, mangaSlug, className }: ChapterItemProps) {
    // mangaSlug here could be "manga-id/chapter/chapter-id" for detail page links
    const encodedId = encodeURIComponent(chapter.id)
    const linkTo = mangaSlug.includes('/chapter/') ? `/manga/${mangaSlug}` : `/manga/${mangaSlug}/chapter/${encodedId}`

    return (
        <Link
            to={linkTo}
            className={cn(
                'flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted transition-colors group',
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
                        {chapter.pages > 0 && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Eye className="w-3 h-3" />
                                {chapter.pages} pages
                            </span>
                        )}
                    </div>
                </div>
            </div>
            {chapter.isRead && (
                <Badge variant="outline" className="text-[10px] shrink-0">Read</Badge>
            )}
        </Link>
    )
}
