import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Star, Eye, Bookmark, BookOpen, Share2, Clock, ChevronDown, ChevronUp, Heart, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ChapterItem from '@/components/ChapterItem'
import MangaCard from '@/components/MangaCard'
import { getMangaBySlug, mockManga, mockReviews, formatViews } from '@/lib/mockData'

export default function TitleDetail() {
    const { slug } = useParams<{ slug: string }>()
    const manga = getMangaBySlug(slug || '')
    const [showAllChapters, setShowAllChapters] = useState(false)
    const [bookmarked, setBookmarked] = useState(false)

    if (!manga) {
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

    const related = mockManga.filter(m => m.id !== manga.id && m.genres.some(g => manga.genres.includes(g))).slice(0, 6)
    const displayChapters = showAllChapters ? manga.chapters : manga.chapters.slice(0, 15)

    return (
        <div className="min-h-screen">
            {/* Banner */}
            <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
                <img src={manga.banner || manga.cover} alt="" className="w-full h-full object-cover opacity-40 dark:opacity-30 blur-xl scale-110" />
                <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/70 to-background" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-40 sm:-mt-48 relative z-10 pb-16">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Cover + Actions */}
                    <div className="flex flex-col items-center lg:items-start shrink-0">
                        <div className="w-48 sm:w-56 aspect-[3/4.5] rounded-2xl overflow-hidden shadow-2xl shadow-sky-500/10 ring-1 ring-border mb-6">
                            <img src={manga.cover} alt={manga.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col gap-2 w-full max-w-[224px]">
                            <Link to={`/manga/${manga.slug}/chapter/1`} className="w-full">
                                <Button className="w-full" size="lg">
                                    <BookOpen className="w-5 h-5" /> Start Reading
                                </Button>
                            </Link>
                            <Button variant={bookmarked ? 'default' : 'outline'} className="w-full" onClick={() => setBookmarked(!bookmarked)}>
                                <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-white' : ''}`} />
                                {bookmarked ? 'Bookmarked' : 'Bookmark'}
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
                            <span className="flex items-center gap-1.5 text-amber-500">
                                <Star className="w-5 h-5 fill-amber-500" />
                                <span className="text-lg font-bold">{manga.rating}</span>
                            </span>
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                                <Eye className="w-4 h-4" /> {formatViews(manga.views)} views
                            </span>
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                                <Bookmark className="w-4 h-4" /> {formatViews(manga.bookmarks)} bookmarks
                            </span>
                            <Badge variant={manga.status === 'completed' ? 'success' : 'info'} className="capitalize">
                                {manga.status}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-y-3 gap-x-8 mb-6 text-sm">
                            <div><span className="text-muted-foreground">Author</span><p className="font-medium">{manga.author}</p></div>
                            <div><span className="text-muted-foreground">Artist</span><p className="font-medium">{manga.artist}</p></div>
                            <div><span className="text-muted-foreground">Type</span><p className="font-medium capitalize">{manga.type}</p></div>
                            <div><span className="text-muted-foreground">Chapters</span><p className="font-medium">{manga.chapters.length}</p></div>
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
                                    <span className="text-sm text-muted-foreground font-normal">({manga.chapters.length})</span>
                                </h2>
                            </div>
                            <div className="bg-card rounded-xl border border-border divide-y divide-border overflow-hidden shadow-sm">
                                {displayChapters.map(chapter => (
                                    <ChapterItem key={chapter.id} chapter={chapter} mangaSlug={manga.slug} />
                                ))}
                            </div>
                            {manga.chapters.length > 15 && (
                                <Button variant="ghost" className="w-full mt-3 text-sky-600 dark:text-sky-400" onClick={() => setShowAllChapters(!showAllChapters)}>
                                    {showAllChapters ? (
                                        <>Show Less <ChevronUp className="w-4 h-4 ml-1" /></>
                                    ) : (
                                        <>Show All {manga.chapters.length} Chapters <ChevronDown className="w-4 h-4 ml-1" /></>
                                    )}
                                </Button>
                            )}
                        </div>

                        {/* Reviews */}
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-sky-500" /> Reviews
                            </h2>
                            <div className="space-y-4">
                                {mockReviews.map(review => (
                                    <div key={review.id} className="bg-card rounded-xl border border-border p-4 shadow-sm">
                                        <div className="flex items-start gap-3">
                                            <img src={review.avatar} alt={review.username} className="w-10 h-10 rounded-full shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-semibold">{review.username}</span>
                                                    <span className="flex items-center gap-0.5 text-amber-500 text-xs">
                                                        <Star className="w-3 h-3 fill-amber-500" /> {review.rating}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-2">{review.content}</p>
                                                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors">
                                                    <Heart className="w-3 h-3" /> {review.likes}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
