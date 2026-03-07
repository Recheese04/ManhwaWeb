import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Star, Eye, Bookmark, BookOpen, Share2, Clock, ChevronDown, ChevronUp, Heart, MessageSquare, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import ChapterItem from '@/components/ChapterItem'
import MangaCard from '@/components/MangaCard'
import { useMangaDetails, useMangaChapters, usePopularManga } from '@/lib/hooks'
import { useAuth } from '@/lib/AuthContext'
import { addBookmark, removeBookmark } from '@/lib/api'

function getCoverImageUrl(url: string): string {
    if (!url) return ''
    if (url.startsWith('/api')) {
        const baseUrl = import.meta.env.VITE_API_URL || 'https://manhwaweb.onrender.com/api'
        return url.replace('/api', baseUrl)
    }
    return url
}

export default function TitleDetail() {
    const { slug } = useParams<{ slug: string }>()
    const { data: manga, loading, error } = useMangaDetails(slug)
    const { data: chapters, loading: chaptersLoading } = useMangaChapters(slug)
    const { data: popularManga } = usePopularManga()
    const { user } = useAuth()

    const [showAllChapters, setShowAllChapters] = useState(false)
    const [bookmarked, setBookmarked] = useState(false)
    const [bookmarkLoading, setBookmarkLoading] = useState(false)

    const handleBookmark = async () => {
        if (!user || !manga) return
        setBookmarkLoading(true)
        try {
            if (bookmarked) {
                await removeBookmark(manga.id)
            } else {
                await addBookmark(manga.id)
            }
            setBookmarked(!bookmarked)
        } catch (err) {
            console.error('Bookmark error:', err)
        } finally {
            setBookmarkLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen">
                <Skeleton className="h-80 w-full" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-40 relative z-10">
                    <div className="flex flex-col lg:flex-row gap-8">
                        <Skeleton className="w-56 aspect-[3/4.5] rounded-2xl shrink-0" />
                        <div className="flex-1 space-y-4 pt-4">
                            <Skeleton className="h-8 w-64" />
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-20 w-full" />
                            <div className="flex gap-2">
                                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6 w-16 rounded-full" />)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (error || !manga) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Title Not Found</h1>
                    <p className="text-muted-foreground mb-4">The manga you're looking for doesn't exist.</p>
                    <Link to="/browse"><Button variant="outline">Browse Library</Button></Link>
                </div>
            </div>
        )
    }

    const related = popularManga
        .filter(m => m.id !== manga.id && m.genres.some(g => manga.genres.includes(g)))
        .slice(0, 6)

    const displayChapters = showAllChapters ? chapters : chapters.slice(0, 15)
    const firstChapterId = chapters.length > 0 ? chapters[chapters.length - 1]?.id : null

    return (
        <div className="min-h-screen">
            {/* Banner */}
            <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
                <img src={getCoverImageUrl(manga.cover)} alt="" className="w-full h-full object-cover opacity-40 dark:opacity-30 blur-xl scale-110" />
                <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/70 to-background" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-40 sm:-mt-48 relative z-10 pb-16">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Cover + Actions */}
                    <div className="flex flex-col items-center lg:items-start shrink-0">
                        <div className="w-48 sm:w-56 aspect-[3/4.5] rounded-2xl overflow-hidden shadow-2xl shadow-sky-500/10 ring-1 ring-border mb-6">
                            <img src={getCoverImageUrl(manga.cover)} alt={manga.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col gap-2 w-full max-w-[224px]">
                            {firstChapterId ? (
                                <Link to={`/manga/${manga.slug}/chapter/${encodeURIComponent(firstChapterId)}`} className="w-full">
                                    <Button className="w-full" size="lg">
                                        <BookOpen className="w-5 h-5" /> Start Reading
                                    </Button>
                                </Link>
                            ) : (
                                <Button className="w-full" size="lg" disabled>
                                    <BookOpen className="w-5 h-5" /> No Chapters Yet
                                </Button>
                            )}
                            <Button
                                variant={bookmarked ? 'default' : 'outline'}
                                className="w-full"
                                onClick={handleBookmark}
                                disabled={!user || bookmarkLoading}
                            >
                                <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-white' : ''}`} />
                                {!user ? 'Login to Bookmark' : bookmarked ? 'Bookmarked' : 'Bookmark'}
                            </Button>
                            <Button variant="ghost" className="w-full text-muted-foreground">
                                <Share2 className="w-4 h-4" /> Share
                            </Button>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <Badge variant="info" className="mb-3 capitalize">{manga.type}</Badge>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">{manga.title}</h1>
                        {manga.altTitles && manga.altTitles.length > 0 && (
                            <p className="text-sm text-muted-foreground mb-4">{manga.altTitles.join(' • ')}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 mb-6">
                            {manga.rating > 0 && (
                                <span className="flex items-center gap-1.5 text-amber-500">
                                    <Star className="w-5 h-5 fill-amber-500" />
                                    <span className="text-lg font-bold">{manga.rating}</span>
                                </span>
                            )}
                            <Badge variant={manga.status === 'completed' ? 'success' : 'info'} className="capitalize">
                                {manga.status}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-y-3 gap-x-8 mb-6 text-sm">
                            <div><span className="text-muted-foreground">Author</span><p className="font-medium">{manga.author}</p></div>
                            <div><span className="text-muted-foreground">Artist</span><p className="font-medium">{manga.artist}</p></div>
                            <div><span className="text-muted-foreground">Type</span><p className="font-medium capitalize">{manga.type}</p></div>
                            <div><span className="text-muted-foreground">Chapters</span><p className="font-medium">{chapters.length}</p></div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-6">
                            {manga.genres.map(genre => (
                                <Link key={genre} to={`/browse?genre=${genre.toLowerCase()}`}>
                                    <Badge variant="secondary" className="hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer">
                                        {genre}
                                    </Badge>
                                </Link>
                            ))}
                        </div>

                        <div className="mb-8">
                            <h2 className="text-lg font-semibold mb-3">Synopsis</h2>
                            <p className="text-muted-foreground leading-relaxed">{manga.synopsis}</p>
                        </div>

                        {/* Chapters */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-sky-500" /> Chapters
                                    <span className="text-sm text-muted-foreground font-normal">({chapters.length})</span>
                                </h2>
                            </div>
                            {chaptersLoading ? (
                                <div className="space-y-2">
                                    {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
                                </div>
                            ) : chapters.length === 0 ? (
                                <div className="text-center py-12 bg-card rounded-xl border border-border">
                                    <p className="text-muted-foreground">No chapters available yet.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-card rounded-xl border border-border divide-y divide-border overflow-hidden shadow-sm">
                                        {displayChapters.map(chapter => (
                                            <ChapterItem key={chapter.id} chapter={chapter} mangaSlug={`${manga.slug}/chapter/${chapter.id}`} />
                                        ))}
                                    </div>
                                    {chapters.length > 15 && (
                                        <Button variant="ghost" className="w-full mt-3 text-sky-600 dark:text-sky-400" onClick={() => setShowAllChapters(!showAllChapters)}>
                                            {showAllChapters ? (
                                                <>Show Less <ChevronUp className="w-4 h-4 ml-1" /></>
                                            ) : (
                                                <>Show All {chapters.length} Chapters <ChevronDown className="w-4 h-4 ml-1" /></>
                                            )}
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {related.length > 0 && (
                    <section className="mt-12">
                        <h2 className="text-xl font-bold mb-6">You May Also Like</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {related.map(m => <MangaCard key={m.id} manga={m} />)}
                        </div>
                    </section>
                )}
            </div>
        </div>
    )
}
