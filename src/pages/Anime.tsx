import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Play, Search, Flame, Tv } from 'lucide-react'

interface Anime {
    id: string
    title: string | { english?: string; romaji?: string; native?: string }
    image: string
    releaseDate?: string
    episodeNumber?: number
}

const Anime: React.FC = () => {
    const [trending, setTrending] = useState<Anime[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<Anime[]>([])
    const [isSearching, setIsSearching] = useState(false)

    useEffect(() => {
        fetchTrending()
    }, [])

    const fetchTrending = async () => {
        try {
            const res = await fetch('/api/anime/popular')
            const data = await res.json()
            setTrending(data.data || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchQuery.trim()) return
        setIsSearching(true)
        try {
            const res = await fetch(`/api/anime/search?q=${encodeURIComponent(searchQuery)}`)
            const data = await res.json()
            setSearchResults(data.data || [])
        } catch (err) {
            console.error(err)
        } finally {
            setIsSearching(false)
        }
    }

    const getAnimeTitle = (anime: Anime) => {
        if (typeof anime.title === 'string') return anime.title
        return anime.title.english || anime.title.romaji || 'Unknown Title'
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-20">
            {/* Hero Section */}
            <div className="relative h-[400px] w-full overflow-hidden">
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
                    <h1 className="text-4xl md:text-6xl font-black mb-4">
                        Watch Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">Favorite</span> Anime
                    </h1>
                    
                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="relative max-w-2xl mt-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search anime..."
                            className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-sky-500 transition-all backdrop-blur-md"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button 
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 rounded-xl font-medium transition-colors"
                        >
                            {isSearching ? '...' : 'Search'}
                        </button>
                    </form>
                </div>
            </div>

            <div className="px-6 md:px-12 -mt-10 relative z-30">
                {/* Search Results */}
                {searchResults.length > 0 && (
                    <section className="mb-12">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Search className="text-sky-400" /> Search Results
                            </h2>
                            <button onClick={() => setSearchResults([])} className="text-slate-400 hover:text-white text-sm">Clear</button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                            {searchResults.map((anime) => (
                                <AnimeCard key={anime.id} anime={anime} title={getAnimeTitle(anime)} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Trending Section */}
                <section>
                    <div className="flex items-center gap-2 mb-8">
                        <Flame className="text-orange-500" fill="currentColor" />
                        <h2 className="text-2xl font-bold">Trending Now</h2>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className="aspect-[3/4] bg-slate-900 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                            {trending.map((anime) => (
                                <AnimeCard key={anime.id} anime={anime} title={getAnimeTitle(anime)} />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}

const AnimeCard = ({ anime, title }: { anime: Anime, title: string }) => (
    <Link to={`/anime/${anime.id}`} className="group relative">
        <div className="aspect-[3/4] rounded-2xl overflow-hidden relative border border-slate-800 shadow-2xl transition-all duration-300 group-hover:scale-105 group-hover:border-sky-500/50">
            <img 
                src={anime.image} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                alt={title}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
            <div className="absolute bottom-3 left-3 right-3 z-10">
                <p className="text-sm font-bold line-clamp-2 drop-shadow-lg">{title}</p>
                {anime.releaseDate && <p className="text-[10px] text-slate-400 mt-1">{anime.releaseDate}</p>}
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/40 backdrop-blur-[2px]">
                <div className="bg-sky-500 p-3 rounded-full scale-75 group-hover:scale-100 transition-transform">
                    <Play fill="white" />
                </div>
            </div>
        </div>
    </Link>
)

export default Anime
