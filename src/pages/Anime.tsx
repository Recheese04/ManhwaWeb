import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Play, Search, Flame, Tv, Star, Loader2 } from 'lucide-react'

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
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<Anime[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchTrending()
    }, [])

    const fetchTrending = async () => {
        try {
            const res = await fetch('/api/anime/popular')
            const data = await res.json()
            if (data.error) throw new Error(data.error)
            setTrending(data.data || [])
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
                    <div className="flex items-center gap-2 text-sky-400 font-medium mb-2">
                        <Tv size={20} />
                        <span className="tracking-widest uppercase text-sm">Anime Streaming</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-6">
                        Watch Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">Favorite</span> Anime
                    </h1>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="relative max-w-2xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search anime..."
                            className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl py-4 pl-12 pr-32 focus:outline-none focus:border-sky-500 transition-all backdrop-blur-md text-white placeholder:text-slate-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-sky-500 hover:bg-sky-600 text-white px-5 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2"
                        >
                            {isSearching ? <Loader2 size={16} className="animate-spin" /> : null}
                            Search
                        </button>
                    </form>
                </div>
            </div>

            <div className="px-6 md:px-12 -mt-8 relative z-30">
                {/* Search Results */}
                {searchResults.length > 0 && (
                    <section className="mb-12">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Search size={20} className="text-sky-400" /> Search Results
                            </h2>
                            <button onClick={() => setSearchResults([])} className="text-slate-400 hover:text-white text-sm transition-colors">
                                Clear
                            </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {searchResults.map(anime => <AnimeCard key={anime.id} anime={anime} />)}
                        </div>
                    </section>
                )}

                {/* Error */}
                {error && (
                    <div className="text-center py-20 text-slate-400">
                        <p className="text-xl font-bold text-red-400 mb-2">Something went wrong</p>
                        <p>{error}</p>
                    </div>
                )}

                {/* Trending Section */}
                {!error && (
                    <section>
                        <div className="flex items-center gap-2 mb-8">
                            <Flame className="text-orange-500" fill="currentColor" />
                            <h2 className="text-2xl font-bold">Trending Now</h2>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} className="aspect-[3/4] bg-slate-900 rounded-2xl animate-pulse" />
                                ))}
                            </div>
                        ) : trending.length === 0 ? (
                            <div className="text-center py-20 text-slate-400">
                                <Tv size={48} className="mx-auto mb-4 opacity-30" />
                                <p>No anime loaded. Check if your server is running.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {trending.map(anime => <AnimeCard key={anime.id} anime={anime} />)}
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
        <div className="aspect-[3/4] rounded-2xl overflow-hidden relative border border-slate-800 shadow-2xl transition-all duration-300 group-hover:scale-105 group-hover:border-sky-500/60">
            <img
                src={anime.image}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                alt={anime.title}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                <p className="text-xs font-bold line-clamp-2 drop-shadow-lg leading-tight">{anime.title}</p>
                <div className="flex items-center gap-2 mt-1">
                    {anime.rating && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-400">
                            <Star size={10} fill="currentColor" />{anime.rating}
                        </span>
                    )}
                    {anime.totalEpisodes && (
                        <span className="text-[10px] text-slate-400">{anime.totalEpisodes} eps</span>
                    )}
                </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/40 backdrop-blur-[2px]">
                <div className="bg-sky-500 p-3 rounded-full scale-75 group-hover:scale-100 transition-transform shadow-lg shadow-sky-500/40">
                    <Play fill="white" size={20} />
                </div>
            </div>
        </div>
    </Link>
)

export default Anime
