import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Play, Calendar, Star, Info, List, ArrowLeft, Tv, Users, Filter } from 'lucide-react'

interface Episode {
    id: string
    number: number
    title: string
    isFiller: boolean
}

interface AnimeInfo {
    id: string
    title: string
    image: string
    cover: string
    description: string
    genres: string[]
    rating: string | null
    popularity: number
    totalEpisodes: number | null
    status: string
    season: string
    seasonYear: number
    format: string
    studio: string | null
    episodes: Episode[]
    idMal: number | null
}

const AnimeDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const [info, setInfo] = useState<AnimeInfo | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showFillerFilter, setShowFillerFilter] = useState(false)
    const [selectedRange, setSelectedRange] = useState(0) // Index of 100-episode chunks

    useEffect(() => {
        if (id) {
            fetchInfo()
            setSelectedRange(0) // Reset range on new anime
        }
    }, [id])

    const fetchInfo = async () => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch(`/api/anime/info/${id}`)
            const data = await res.json()
            if (data.error) throw new Error(data.error)
            setInfo(data.data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
    )

    if (error || !info) return (
        <div className="min-h-screen bg-slate-950 text-white p-20 text-center">
            <Tv size={64} className="mx-auto mb-4 opacity-20" />
            <p className="text-xl font-bold text-red-400">{error || 'Anime not found'}</p>
            <Link to="/anime" className="mt-6 inline-block text-sky-400 hover:underline">← Back to Anime</Link>
        </div>
    )

    // Episode range logic
    const chunkSize = 100
    const totalEpisodes = info.episodes.length
    const ranges = []
    for (let i = 0; i < totalEpisodes; i += chunkSize) {
        const start = i + 1
        const end = Math.min(i + chunkSize, totalEpisodes)
        ranges.push(`${start}-${end}`)
    }

    const filteredEpisodes = showFillerFilter
        ? info.episodes.filter(ep => !ep.isFiller)
        : info.episodes

    const displayedEpisodes = filteredEpisodes.slice(
        selectedRange * chunkSize,
        (selectedRange + 1) * chunkSize
    )

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-20">
            {/* Backdrop */}
            <div className="relative h-[55vh] w-full">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent z-10" />
                <div className="absolute inset-0 bg-slate-950/40 z-10" />
                {info.cover ? (
                    <img src={`/api/img-proxy?url=${encodeURIComponent(info.cover)}`} className="w-full h-full object-cover opacity-60 blur-[2px]" alt="Backdrop" />
                ) : (
                    <img src={`/api/img-proxy?url=${encodeURIComponent(info.image)}`} className="w-full h-full object-cover opacity-40 blur-[2px]" alt="Backdrop" />
                )}
                <Link to="/anime" className="absolute top-8 left-8 z-20 flex items-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-2xl backdrop-blur-xl border border-white/10 transition-all text-sm font-bold group">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Back to Library
                </Link>
            </div>

            <div className="max-w-7xl mx-auto px-6 -mt-64 relative z-20">
                <div className="flex flex-col md:flex-row gap-10 items-start">
                    {/* Poster */}
                    <div className="w-56 md:w-72 shrink-0 mx-auto md:mx-0 group">
                        <div className="rounded-3xl overflow-hidden border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] group-hover:scale-[1.02] transition-transform duration-500">
                            <img src={`/api/img-proxy?url=${encodeURIComponent(info.image)}`} className="w-full aspect-[2/3] object-cover" alt={info.title} />
                        </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs uppercase tracking-widest text-sky-400 font-semibold bg-sky-500/10 px-3 py-1 rounded-full">{info.format}</span>
                            <span className={`text-xs uppercase tracking-widest font-semibold px-3 py-1 rounded-full ${
                                info.status === 'RELEASING' ? 'bg-green-500/10 text-green-400' :
                                info.status === 'FINISHED' ? 'bg-slate-800 text-slate-400' :
                                'bg-yellow-500/10 text-yellow-400'
                            }`}>{info.status}</span>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight">{info.title}</h1>

                        <div className="flex flex-wrap gap-3 mb-6">
                            {info.rating && (
                                <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-full text-sm font-semibold">
                                    <Star size={14} fill="currentColor" /> {info.rating}/10
                                </div>
                            )}
                            {info.seasonYear && (
                                <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-full text-sm text-slate-300">
                                    <Calendar size={14} /> {info.season} {info.seasonYear}
                                </div>
                            )}
                            {info.popularity && (
                                <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-full text-sm text-slate-300">
                                    <Users size={14} /> {info.popularity.toLocaleString()} fans
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-6">
                            {info.genres.map(genre => (
                                <span key={genre} className="bg-slate-900 border border-slate-700 px-3 py-1 rounded-lg text-xs font-medium text-slate-300">
                                    {genre}
                                </span>
                            ))}
                        </div>

                        {info.description && (
                            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 rounded-2xl mb-6">
                                <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-sky-400">
                                    <Info size={16} /> Synopsis
                                </h3>
                                <p className="text-slate-300 leading-relaxed text-sm line-clamp-5">{info.description}</p>
                            </div>
                        )}

                        {/* Watch First Episode CTA */}
                        {info.episodes.length > 0 && (
                            <Link
                                to={`/anime/watch/${id}/1`}
                                className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-sky-500/25 hover:scale-105 active:scale-95"
                            >
                                <Play fill="white" size={20} /> Watch Episode 1
                            </Link>
                        )}
                    </div>
                </div>

                {/* Episodes List */}
                {info.episodes.length > 0 && (
                    <div className="mt-12">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <List className="text-sky-400" /> Episodes ({info.episodes.length})
                            </h2>
                            
                            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                                {ranges.length > 1 && ranges.map((range, idx) => (
                                    <button
                                        key={range}
                                        onClick={() => setSelectedRange(idx)}
                                        className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                            selectedRange === idx
                                                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                                                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
                                        }`}
                                    >
                                        {range}
                                    </button>
                                ))}
                                
                                <button
                                    onClick={() => setShowFillerFilter(!showFillerFilter)}
                                    className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all ml-2 ${
                                        showFillerFilter
                                            ? 'bg-sky-500/10 border-sky-500/50 text-sky-400'
                                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                                    }`}
                                >
                                    <Filter size={14} /> Hide Filler
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                            {displayedEpisodes.map(ep => (
                                <Link
                                    key={ep.id}
                                    to={`/anime/watch/${id}/${ep.number}`}
                                    title={ep.title}
                                    className={`py-3 text-center font-bold rounded-xl transition-all text-sm hover:scale-105 ${
                                        ep.isFiller
                                            ? 'bg-slate-900/50 border border-slate-800/50 text-slate-600 hover:border-yellow-500/40 hover:text-yellow-500/70'
                                            : 'bg-slate-900 border border-slate-800 hover:border-sky-500 hover:bg-sky-500/10 hover:text-sky-400'
                                    }`}
                                >
                                    {ep.number}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default AnimeDetail
