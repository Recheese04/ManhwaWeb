import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Settings, Info, Loader2, AlertCircle } from 'lucide-react'
import Hls from 'hls.js'

interface Source {
    url: string
    isM3U8: boolean
    quality: string
}

interface WatchData {
    sources?: Source[]
    embedUrl?: string
    episodeId?: string
    title?: string
    provider: string
}

const Watch: React.FC = () => {
    const { anilistId, episodeNumber } = useParams<{ anilistId: string, episodeNumber: string }>()
    
    const [watchData, setWatchData] = useState<WatchData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [currentSource, setCurrentSource] = useState<Source | null>(null)
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        fetchSources()
    }, [anilistId, episodeNumber])

    useEffect(() => {
        if (currentSource && videoRef.current && !watchData?.embedUrl) {
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
    }, [currentSource, watchData])

    const fetchSources = async () => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch(`/api/anime/watch/${anilistId}/${episodeNumber}`)
            const data = await res.json()
            if (data.error) throw new Error(data.error)

            // Proxy all source URLs through our server to bypass CORS
            if (data.data.sources) {
                const proxiedSources = data.data.sources.map((s: any) => ({
                    ...s,
                    url: `/api/stream-proxy?url=${encodeURIComponent(s.url)}`,
                }))
                data.data.sources = proxiedSources
            }
            setWatchData(data.data)

            if (data.data.sources) {
                const availableSources = data.data.sources || []
                const defaultSource = availableSources.find((s: any) => s.quality === 'default' || s.quality === '1080p') || availableSources[0]
                setCurrentSource(defaultSource)
            }
        } catch (err: any) {
            setError(err.message || 'Failed to find streaming links for this episode.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-20">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <Link to={`/anime/${anilistId}`} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} /> Back to Anime
                    </Link>
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-sm text-slate-400">
                        <Info size={16} className="text-sky-400" /> Currently Watching: <span className="text-white ml-1 font-bold">Episode {episodeNumber}</span>
                    </div>
                </div>

                {/* Video Player */}
                <div className="relative aspect-video w-full bg-black rounded-3xl overflow-hidden shadow-[0_0_50px_-12px_rgba(56,189,248,0.3)] border border-slate-800">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
                            <Loader2 size={48} className="text-sky-500 animate-spin" />
                            <p className="text-slate-400 animate-pulse">Searching multiple sources...</p>
                        </div>
                    ) : error ? (
                        <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 p-8 text-center">
                            <AlertCircle size={48} className="text-red-500 opacity-50" />
                            <p className="text-xl font-bold text-slate-300">{error}</p>
                            <p className="text-sm text-slate-500 max-w-md">Some providers might be down or this episode hasn't been scraped yet. Try again later or try another episode.</p>
                        </div>
                    ) : watchData?.embedUrl ? (
                        <iframe 
                            src={watchData.embedUrl}
                            className="w-full h-full"
                            allowFullScreen
                            scrolling="no"
                        />
                    ) : (
                        <video 
                            ref={videoRef}
                            controls
                            className="w-full h-full"
                        />
                    )}
                </div>

                {/* Controls & Info */}
                {!loading && !error && (
                    <div className="mt-8 flex flex-col md:flex-row gap-8">
                        <div className="flex-1">
                            <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl backdrop-blur-md">
                                <h2 className="text-2xl font-black mb-2">
                                    {watchData?.title || `Episode ${episodeNumber}`}
                                </h2>
                                <p className="text-slate-400 flex items-center gap-2 mb-6">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    Streaming from: <span className="text-sky-400 font-bold">{watchData?.provider}</span>
                                </p>
                                
                                <div className="mt-8 flex gap-4">
                                    <Link 
                                        to={`/anime/watch/${anilistId}/${parseInt(episodeNumber || '1') + 1}`}
                                        className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-sky-500/20 text-center"
                                    >
                                        Next Episode
                                    </Link>
                                    <button className="px-8 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all">
                                        Report
                                    </button>
                                </div>
                            </div>
                        </div>

                        {watchData?.sources && watchData.sources.length > 0 && (
                            <div className="w-full md:w-80">
                                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl backdrop-blur-md">
                                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                                        <Settings size={18} className="text-sky-400" /> Select Quality
                                    </h3>
                                    <div className="space-y-2">
                                        {watchData.sources.map((s, idx) => (
                                            <button 
                                                key={idx}
                                                onClick={() => setCurrentSource(s)}
                                                className={`w-full text-left px-4 py-3 rounded-xl transition-all font-medium ${
                                                    currentSource?.url === s.url 
                                                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' 
                                                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                                                }`}
                                            >
                                                {s.quality.toUpperCase()} Quality
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Watch
