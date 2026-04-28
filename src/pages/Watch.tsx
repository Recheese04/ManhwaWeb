import React, { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { ArrowLeft, Settings, Info, List } from 'lucide-react'
import Hls from 'hls.js'

interface Source {
    url: string
    isM3U8: boolean
    quality: string
}

const Watch: React.FC = () => {
    const { episodeId } = useParams<{ episodeId: string }>()
    const [searchParams] = useSearchParams()
    const animeId = searchParams.get('animeId')
    const [sources, setSources] = useState<Source[]>([])
    const [loading, setLoading] = useState(true)
    const [currentSource, setCurrentSource] = useState<Source | null>(null)
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        fetchSources()
    }, [episodeId])

    useEffect(() => {
        if (currentSource && videoRef.current) {
            const video = videoRef.current
            const url = currentSource.url

            if (Hls.isSupported()) {
                const hls = new Hls()
                hls.loadSource(url)
                hls.attachMedia(video)
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    video.play().catch(() => {})
                })
                return () => hls.destroy()
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = url
                video.addEventListener('loadedmetadata', () => {
                    video.play().catch(() => {})
                })
            }
        }
    }, [currentSource])

    const fetchSources = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/anime/watch/${episodeId}`)
            const data = await res.json()
            const availableSources = data.data.sources || []
            setSources(availableSources)
            // Default to high quality or first source
            const defaultSource = availableSources.find((s: any) => s.quality === 'default') || availableSources[0]
            setCurrentSource(defaultSource)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-20">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <Link to={animeId ? `/anime/${animeId}` : '/anime'} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} /> Back to Anime
                    </Link>
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-sm text-slate-400">
                        <Info size={16} className="text-sky-400" /> Currently Watching: <span className="text-white ml-1 font-bold">{episodeId}</span>
                    </div>
                </div>

                {/* Video Player */}
                <div className="relative aspect-video w-full bg-black rounded-3xl overflow-hidden shadow-[0_0_50px_-12px_rgba(56,189,248,0.3)] border border-slate-800">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <video 
                            ref={videoRef}
                            controls
                            className="w-full h-full"
                            poster="https://images.unsplash.com/photo-1541562232579-512a21359920?auto=format&fit=crop&q=80&w=1200"
                        />
                    )}
                </div>

                {/* Controls & Source Selection */}
                <div className="mt-8 flex flex-col md:flex-row gap-8">
                    <div className="flex-1">
                        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl backdrop-blur-md">
                            <h2 className="text-2xl font-black mb-4">Watching Episode {episodeId?.split('-').pop()}</h2>
                            <p className="text-slate-400 italic">If the video doesn't play, try switching to a different quality source on the right.</p>
                            
                            <div className="mt-8 flex gap-4">
                                <button className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-sky-500/20">
                                    Next Episode
                                </button>
                                <button className="px-8 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all">
                                    Report
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-80">
                        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl backdrop-blur-md">
                            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                                <Settings size={18} className="text-sky-400" /> Select Quality
                            </h3>
                            <div className="space-y-2">
                                {sources.map((s, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => setCurrentSource(s)}
                                        className={`w-full text-left px-4 py-3 rounded-xl transition-all font-medium ${
                                            currentSource?.url === s.url 
                                            ? 'bg-sky-500 text-white' 
                                            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                                        }`}
                                    >
                                        {s.quality.toUpperCase()} Quality
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Watch
