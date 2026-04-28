import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Play, Calendar, Star, Info, List, ArrowLeft } from 'lucide-react'

interface Episode {
    id: string
    number: number
    url: string
}

interface AnimeInfo {
    id: string
    title: string | { english?: string; romaji?: string; native?: string }
    image: string
    description: string
    releaseDate: string
    type: string
    status: string
    genres: string[]
    episodes: Episode[]
}

const AnimeDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const [info, setInfo] = useState<AnimeInfo | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchInfo()
    }, [id])

    const fetchInfo = async () => {
        try {
            const res = await fetch(`/api/anime/info/${id}`)
            const data = await res.json()
            setInfo(data.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
    )

    if (!info) return <div className="min-h-screen bg-slate-950 text-white p-20 text-center">Anime not found</div>

    const title = typeof info.title === 'string' ? info.title : info.title.english || info.title.romaji || 'Unknown Title'

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-20">
            {/* Backdrop */}
            <div className="relative h-[50vh] w-full">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent z-10" />
                <img src={info.image} className="w-full h-full object-cover opacity-30 blur-sm" alt="Backdrop" />
                <Link to="/anime" className="absolute top-8 left-8 z-20 flex items-center gap-2 bg-slate-900/50 hover:bg-slate-800 px-4 py-2 rounded-xl backdrop-blur-md transition-all">
                    <ArrowLeft size={20} /> Back
                </Link>
            </div>

            <div className="max-w-7xl mx-auto px-6 -mt-60 relative z-20">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Poster */}
                    <div className="w-64 shrink-0 mx-auto md:mx-0">
                        <div className="rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl">
                            <img src={info.image} className="w-full object-cover" alt={title} />
                        </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                        <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">{title}</h1>
                        
                        <div className="flex flex-wrap gap-4 mb-6">
                            <div className="flex items-center gap-2 bg-sky-500/10 text-sky-400 px-3 py-1 rounded-full text-sm font-medium">
                                <Star size={16} fill="currentColor" /> {info.type}
                            </div>
                            <div className="flex items-center gap-2 bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                                <Calendar size={16} /> {info.releaseDate}
                            </div>
                            <div className="bg-slate-800 px-3 py-1 rounded-full text-sm font-medium">
                                {info.status}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-8">
                            {info.genres.map(genre => (
                                <span key={genre} className="bg-slate-900 border border-slate-800 px-4 py-1 rounded-lg text-sm hover:border-sky-500/50 transition-colors cursor-default">
                                    {genre}
                                </span>
                            ))}
                        </div>

                        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-6 rounded-2xl mb-8">
                            <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
                                <Info size={18} className="text-sky-400" /> Synopsis
                            </h3>
                            <p className="text-slate-300 leading-relaxed text-sm md:text-base italic" dangerouslySetInnerHTML={{ __html: info.description }} />
                        </div>
                    </div>
                </div>

                {/* Episodes List */}
                <div className="mt-12">
                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
                        <List className="text-sky-400" /> Episodes ({info.episodes.length})
                    </h2>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                        {info.episodes.map(ep => (
                            <Link 
                                key={ep.id} 
                                to={`/anime/watch/${ep.id}?animeId=${info.id}`}
                                className="bg-slate-900 border border-slate-800 hover:border-sky-500 hover:bg-sky-500/10 transition-all rounded-xl py-3 text-center font-bold"
                            >
                                Ep {ep.number}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AnimeDetail
