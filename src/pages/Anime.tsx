import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Play, Search, Flame, Tv, Star, Loader2, Clock } from 'lucide-react'

interface Anime {
    id: string
    title: string
    image: string
    rating: string | null
    totalEpisodes: number | null
    status: string
    format: string
    genres: string[]
}

const Anime: React.FC = () => {
    const [trending, setTrending] = useState<Anime[]>([])
    const [recent, setRecent] = useState<Anime[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<Anime[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchAll()
    }, [])

    const fetchAll = async () => {
        setLoading(true)
        try {
            const [trendingRes, recentRes] = await Promise.all([
                fetch('/api/anime/popular'),
                fetch('/api/anime/recent')
            ])
            const trendingData = await trendingRes.json()
            const recentData = await recentRes.json()
            
            setTrending(trendingData.data || [])
            setRecent(recentData.data || [])
        } catch (err: any) {
            setError(err.message || 'Failed to load anime')
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchQuery.trim()) return
        setIsSearching(true)
        setError('')
        try {
            const res = await fetch(`/api/anime/search?q=${encodeURIComponent(searchQuery)}`)
            const data = await res.json()
            setSearchResults(data.data || [])
        } catch (err: any) {
            setError('Search failed')
        } finally {
            setIsSearching(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-20">
            {/* Hero Section */}
            <div className="relative h-[380px] w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent z-10" />
                <img
                    src="https://images.unsplash.com/photo-1578632292335-df3abbb0d586?auto=format&fit=crop&q=80&w=2000"
                    className="w-full h-full object-cover opacity-50"
                    alt="Anime Banner"
                />
        <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-12 z-20">
            <div className="flex items-center gap-2 text-sky-400 font-bold mb-3">
                <div className="w-8 h-[2px] bg-sky-500 rounded-full" />
                <span className="tracking-[0.2em] uppercase text-xs">Premium Streaming</span>
            </div>
            <h1 className="text-3xl md:text-6xl font-black mb-6 md:mb-8 max-w-3xl leading-[1.1]">
                Your Ultimate <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">Anime</span> Experience
            </h1>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative max-w-2xl group">
                <div className="absolute inset-0 bg-sky-500/20 blur-2xl rounded-3xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={20} />
                <input
                    type="text"
                    placeholder="Search titles, genres, or studios..."
                    className="w-full bg-slate-900/60 border border-white/10 rounded-[2rem] py-4 sm:py-5 pl-12 sm:pl-14 pr-28 sm:pr-36 focus:outline-none focus:border-sky-500/50 focus:bg-slate-900 transition-all backdrop-blur-xl text-sm sm:text-base text-white placeholder:text-slate-500 shadow-2xl"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                    type="submit"
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 bg-sky-500 hover:bg-sky-600 text-white px-4 sm:px-7 py-2 sm:py-3 rounded-full sm:rounded-[1.5rem] font-bold transition-all flex items-center gap-1 sm:gap-2 shadow-lg shadow-sky-500/25 active:scale-95 text-sm sm:text-base"
                >
                    {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
                    <span className="hidden sm:inline">Search</span>
                </button>
            </form>
        </div>
    </div>

    <div className="px-6 md:px-12 -mt-12 relative z-30">
        {/* Search Results */}
        {searchResults.length > 0 && (
            <section className="mb-16">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black flex items-center gap-3">
                        <div className="w-2 h-8 bg-sky-500 rounded-full" />
                        Search Results
                    </h2>
                    <button 
                        onClick={() => setSearchResults([])} 
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-800 px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-bold transition-all"
                    >
                        CLEAR RESULTS
                    </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {searchResults.map((anime, index) => <AnimeCard key={`${anime.id}-${index}-search`} anime={anime} />)}
                </div>
            </section>
        )}

        {/* Recent Updates */}
        {!error && !loading && recent.length > 0 && (
            <section className="mb-20">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-2 h-8 bg-sky-500 rounded-full" />
                    <h2 className="text-2xl font-black">Recent Updates</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {recent.map((anime, index) => <AnimeCard key={`${anime.id}-${index}-recent`} anime={anime} />)}
                </div>
            </section>
        )}

        {/* Trending Section */}
        {!error && (
            <section>
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-2 h-8 bg-orange-500 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.4)]" />
                    <h2 className="text-2xl font-black">Trending Now</h2>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="aspect-[2/3] bg-slate-900/50 rounded-3xl animate-pulse border border-white/5" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {trending.map((anime, index) => <AnimeCard key={`${anime.id}-${index}-trending`} anime={anime} />)}
                    </div>
                )}
            </section>
        )}
    </div>
</div>
)
}

const AnimeCard = ({ anime }: { anime: Anime }) => (
<Link to={`/anime/${anime.id}`} className="group relative">
<div className="aspect-[2/3] rounded-[2rem] overflow-hidden relative border border-white/5 shadow-2xl transition-all duration-500 group-hover:scale-[1.05] group-hover:border-sky-500/40 group-hover:shadow-sky-500/10">
    <img
        src={`/api/img-proxy?url=${encodeURIComponent(anime.image)}`}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        alt={anime.title}
        loading="lazy"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent opacity-90" />
    
    {/* Overlay Info */}
    <div className="absolute bottom-0 left-0 right-0 p-5 z-10 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
        <p className="text-sm font-black line-clamp-2 drop-shadow-2xl leading-tight mb-2 group-hover:text-sky-400 transition-colors">{anime.title}</p>
        <div className="flex items-center gap-3">
            {anime.rating && (
                <span className="flex items-center gap-1 text-[10px] font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                    <Star size={10} fill="currentColor" />{anime.rating}
                </span>
            )}
            {anime.totalEpisodes && (
                <span className="text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/10 uppercase tracking-tighter">
                    {anime.totalEpisodes} EP
                </span>
            )}
        </div>
    </div>

    {/* Play Button Overlay */}
    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-slate-950/20 backdrop-blur-[1px]">
        <div className="bg-sky-500 p-4 rounded-full scale-50 group-hover:scale-100 transition-all duration-500 shadow-[0_0_30px_rgba(56,189,248,0.5)]">
            <Play fill="white" size={24} className="ml-1" />
        </div>
    </div>
</div>
</Link>
)

export default Anime
