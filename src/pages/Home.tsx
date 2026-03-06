import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
    Star, Eye, TrendingUp, Clock, Sparkles, ChevronRight, ChevronLeft,
    BookOpen, ArrowRight, Play, Flame, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import MangaCard from '@/components/MangaCard'
import { usePopularManga, useLatestManga } from '@/lib/hooks'
import { GENRES } from '@/lib/types'
import { cn } from '@/lib/utils'
import type { ApiManga } from '@/lib/api'

type TabType = 'all' | 'manga' | 'manhwa' | 'manhua'

function formatViews(views: number): string {
    if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`
    if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`
    return String(views)
}

// Skeleton for loading cards
function CardSkeleton() {
    return (
        <div className="space-y-2">
            <Skeleton className="aspect-[3/4.5] rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
        </div>
    )
}

export default function Home() {
    const [activeTab, setActiveTab] = useState<TabType>('all')
    const [currentSlide, setCurrentSlide] = useState(0)

    const { data: popular, loading: popularLoading } = usePopularManga()
    const { data: latest, loading: latestLoading } = useLatestManga()

    // Use first 5 popular for carousel
    const carouselItems = popular.slice(0, 5)

    const nextSlide = useCallback(() => {
        if (carouselItems.length === 0) return
        setCurrentSlide(prev => (prev + 1) % carouselItems.length)
    }, [carouselItems.length])

    const prevSlide = useCallback(() => {
        if (carouselItems.length === 0) return
        setCurrentSlide(prev => (prev - 1 + carouselItems.length) % carouselItems.length)
    }, [carouselItems.length])

    useEffect(() => {
        if (carouselItems.length === 0) return
        const interval = setInterval(nextSlide, 6000)
        return () => clearInterval(interval)
    }, [nextSlide, carouselItems.length])

    // Filter by type tab
    const filterByTab = (list: ApiManga[]) =>
        activeTab === 'all' ? list : list.filter(m => m.type === activeTab)

    const trending = filterByTab(popular).slice(0, 6)
    const latestUpdates = filterByTab(latest).slice(0, 8)
    const recommended = filterByTab(popular).slice(6, 12)

    const tabs: { label: string; value: TabType }[] = [
        { label: 'All', value: 'all' },
        { label: 'Manga', value: 'manga' },
        { label: 'Manhwa', value: 'manhwa' },
        { label: 'Manhua', value: 'manhua' },
    ]

    const currentManga = carouselItems[currentSlide]

    return (
        <div className="min-h-screen">
            {/* ============ HERO CAROUSEL ============ */}
            <section className="relative w-full h-[500px] sm:h-[560px] lg:h-[620px] overflow-hidden">
                {popularLoading || !currentManga ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
                    </div>
                ) : (
                    <>
                        {/* Background layers */}
                        {carouselItems.map((manga, index) => (
                            <div
                                key={manga.id}
                                className={cn(
                                    'absolute inset-0 transition-opacity duration-700 ease-in-out',
                                    index === currentSlide ? 'opacity-100' : 'opacity-0'
                                )}
                            >
                                <img
                                    src={manga.cover}
                                    alt=""
                                    className="w-full h-full object-cover scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/30" />
                                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
                            </div>
                        ))}

                        {/* Carousel Content */}
                        <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center">
                            <div className="flex flex-col lg:flex-row items-center lg:items-center gap-8 lg:gap-14 w-full">
                                {/* Cover Image */}
                                <div className="relative shrink-0 hidden sm:block">
                                    <div className="w-52 sm:w-60 lg:w-72 aspect-[3/4.3] rounded-2xl overflow-hidden shadow-2xl shadow-sky-500/20 ring-1 ring-border transition-all duration-500">
                                        {carouselItems.map((manga, index) => (
                                            <img
                                                key={manga.id}
                                                src={manga.cover}
                                                alt={manga.title}
                                                className={cn(
                                                    'absolute inset-0 w-full h-full object-cover transition-all duration-500',
                                                    index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                                                )}
                                            />
                                        ))}
                                    </div>
                                    <div className="absolute -top-3 -left-3 w-14 h-14 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-sky-500/30">
                                        #{currentSlide + 1}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 text-center lg:text-left max-w-2xl">
                                    <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                                        <Badge className="gap-1 px-3 py-1">
                                            <Flame className="w-3.5 h-3.5" />
                                            Trending #{currentSlide + 1}
                                        </Badge>
                                        <Badge variant="outline" className="capitalize px-3 py-1">{currentManga.type}</Badge>
                                        <Badge variant={currentManga.status === 'completed' ? 'success' : 'info'} className="capitalize px-3 py-1">
                                            {currentManga.status}
                                        </Badge>
                                    </div>

                                    <h1
                                        key={currentManga.id}
                                        className="text-3xl sm:text-5xl lg:text-6xl font-extrabold mb-4 leading-[1.1] animate-fade-in"
                                    >
                                        {currentManga.title}
                                    </h1>

                                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-4 text-sm">
                                        {currentManga.rating > 0 && (
                                            <>
                                                <span className="flex items-center gap-1 text-amber-500 font-semibold">
                                                    <Star className="w-4 h-4 fill-amber-500" />
                                                    {currentManga.rating}
                                                </span>
                                                <span className="text-muted-foreground/50">•</span>
                                            </>
                                        )}
                                        {currentManga.views > 0 && (
                                            <>
                                                <span className="flex items-center gap-1 text-muted-foreground">
                                                    <Eye className="w-4 h-4" />
                                                    {formatViews(currentManga.views)}
                                                </span>
                                                <span className="text-muted-foreground/50">•</span>
                                            </>
                                        )}
                                        <span className="text-muted-foreground">
                                            by {currentManga.author}
                                        </span>
                                    </div>

                                    <p
                                        key={`syn-${currentManga.id}`}
                                        className="text-muted-foreground line-clamp-2 sm:line-clamp-3 mb-5 leading-relaxed max-w-xl mx-auto lg:mx-0 text-sm sm:text-base animate-fade-in"
                                    >
                                        {currentManga.synopsis}
                                    </p>

                                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-6">
                                        {currentManga.genres.slice(0, 4).map(genre => (
                                            <Badge key={genre} variant="secondary" className="text-xs px-3 py-1">{genre}</Badge>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-center lg:justify-start gap-3">
                                        <Link to={`/manga/${currentManga.slug}`}>
                                            <Button size="xl" className="gap-2.5 text-lg font-semibold">
                                                <Play className="w-5 h-5 fill-white" />
                                                Read Now
                                            </Button>
                                        </Link>
                                        <Link to={`/manga/${currentManga.slug}`}>
                                            <Button variant="outline" size="lg" className="text-base">
                                                View Details
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Carousel Controls */}
                        <div className="absolute bottom-0 left-0 right-0 z-20">
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        {carouselItems.map((manga, index) => (
                                            <button
                                                key={manga.id}
                                                onClick={() => setCurrentSlide(index)}
                                                className={cn(
                                                    'h-2 rounded-full transition-all duration-300',
                                                    index === currentSlide ? 'w-12 gradient-primary' : 'w-7 bg-foreground/15 hover:bg-foreground/25'
                                                )}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={prevSlide} className="w-10 h-10 rounded-full border border-border bg-background/70 backdrop-blur-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-sky-300 dark:hover:border-sky-500 transition-all">
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <button onClick={nextSlide} className="w-10 h-10 rounded-full border border-border bg-background/70 backdrop-blur-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-sky-300 dark:hover:border-sky-500 transition-all">
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Slide Thumbnails (Desktop) */}
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20 hidden xl:flex flex-col gap-2.5">
                            {carouselItems.map((manga, index) => (
                                <button
                                    key={manga.id}
                                    onClick={() => setCurrentSlide(index)}
                                    className={cn(
                                        'w-16 h-[88px] rounded-xl overflow-hidden ring-2 transition-all duration-300',
                                        index === currentSlide
                                            ? 'ring-sky-500 scale-110 shadow-lg shadow-sky-500/30'
                                            : 'ring-transparent opacity-40 hover:opacity-70 hover:ring-border'
                                    )}
                                >
                                    <img src={manga.cover} alt={manga.title} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </section>

            {/* ============ CATEGORY TABS ============ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-6">
                <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value)}
                            className={cn(
                                'px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200',
                                activeTab === tab.value
                                    ? 'gradient-primary text-white shadow-lg shadow-sky-500/25'
                                    : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </section>

            {/* ============ POPULAR TODAY ============ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-14">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-sky-500/20">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold">Popular Today</h2>
                    </div>
                    <Link to="/browse?sort=popular" className="flex items-center gap-1 text-sm text-sky-600 dark:text-sky-400 hover:text-sky-500 transition-colors font-medium">
                        View All <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                    {popularLoading
                        ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
                        : trending.map((manga, i) => (
                            <MangaCard key={manga.id} manga={manga} rank={i + 1} />
                        ))}
                </div>
            </section>

            {/* ============ LATEST UPDATES ============ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-14">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-emerald-500" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold">Latest Updates</h2>
                    </div>
                    <Link to="/browse?sort=latest" className="flex items-center gap-1 text-sm text-sky-600 dark:text-sky-400 hover:text-sky-500 transition-colors font-medium">
                        View All <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {latestLoading
                        ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)
                        : latestUpdates.map(manga => (
                            <MangaCard key={manga.id} manga={manga} variant="wide" />
                        ))}
                </div>
            </section>

            {/* ============ DISCOVER BY GENRE ============ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-14">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold">Discover by Genre</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                    {GENRES.map(genre => (
                        <Link key={genre} to={`/browse?genre=${genre.toLowerCase()}`}>
                            <Badge
                                variant="outline"
                                className="px-4 py-2 text-sm cursor-pointer hover:bg-sky-500/10 hover:border-sky-300 dark:hover:border-sky-500/30 hover:text-sky-600 dark:hover:text-sky-400 transition-all duration-200"
                            >
                                {genre}
                            </Badge>
                        </Link>
                    ))}
                </div>
            </section>

            {/* ============ RECOMMENDED FOR YOU ============ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/15 dark:bg-rose-500/20 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-rose-500" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold">Recommended For You</h2>
                    </div>
                    <Link to="/browse" className="flex items-center gap-1 text-sm text-sky-600 dark:text-sky-400 hover:text-sky-500 transition-colors font-medium">
                        Browse All <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                    {popularLoading
                        ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
                        : recommended.map(manga => (
                            <MangaCard key={manga.id} manga={manga} />
                        ))}
                </div>
            </section>
        </div>
    )
}
