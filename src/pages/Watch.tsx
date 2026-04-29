import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Settings, Info, Loader2, AlertCircle } from 'lucide-react'
import Hls from 'hls.js'

interface Source {
    url: string
    isM3U8?: boolean
    isEmbed?: boolean
    quality: string
    provider?: string
    headers?: Record<string, string>
}

interface Subtitle {
    url: string
    lang: string
    label?: string
}

interface WatchData {
    sources?: Source[]
    subtitles?: Subtitle[]
    title?: string
}

const Watch: React.FC = () => {
    const { anilistId, episodeNumber } = useParams<{ anilistId: string, episodeNumber: string }>()
    
    const [watchData, setWatchData] = useState<WatchData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [currentSource, setCurrentSource] = useState<Source | null>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const hlsRef = useRef<Hls | null>(null)

    // Fetch sources on mount and when episode changes
    useEffect(() => {
        fetchSources()
    }, [anilistId, episodeNumber])

    // Initialize HLS player when source changes (only for non-embed sources)
    useEffect(() => {
        // Destroy any previous HLS instance
        if (hlsRef.current) {
            hlsRef.current.destroy()
            hlsRef.current = null
        }

        if (!currentSource || currentSource.isEmbed || !videoRef.current) return

        const video = videoRef.current
        const referer = currentSource.headers?.Referer || currentSource.headers?.referer || ''
        const proxiedUrl = `/api/stream-proxy?url=${encodeURIComponent(currentSource.url)}${referer ? `&ref=${encodeURIComponent(referer)}` : ''}`

        if (Hls.isSupported()) {
            const hls = new Hls()
            hlsRef.current = hls
            hls.loadSource(proxiedUrl)
            hls.attachMedia(video)
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(() => {})
            })
            hls.on(Hls.Events.ERROR, (_event, data) => {
                if (data.fatal) {
                    console.error('[HLS] Fatal error:', data.type, data.details)
                }
            })
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = proxiedUrl
            video.play().catch(() => {})
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy()
                hlsRef.current = null
            }
        }
    }, [currentSource])

    const fetchSources = async () => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch(`/api/anime/watch/${anilistId}/${episodeNumber}`)
            const data = await res.json()
            if (data.error) throw new Error(data.error)

            setWatchData(data.data)

            if (data.data.sources && data.data.sources.length > 0) {
                const availableSources = data.data.sources as Source[]
                // Prefer 1080p English, then default, then first available
                const defaultSource =
                    availableSources.find((s) => s.quality?.includes('1080') && s.quality?.toLowerCase().includes('english')) ||
                    availableSources.find((s) => s.quality === 'default' || s.quality === '1080p') ||
                    availableSources[0]
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-6 sm:mb-8">
                    <Link to={`/anime/${anilistId}`} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} /> Back to Anime
                    </Link>
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm text-slate-400 w-full sm:w-auto justify-center sm:justify-start">
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
                    ) : currentSource?.isEmbed ? (
                        <iframe 
                            src={currentSource.url}
                            className="w-full h-full border-0"
                            allowFullScreen
                            scrolling="no"
                        />
                    ) : (
                        <video 
                            ref={videoRef}
                            controls
                            crossOrigin="anonymous"
                            className="w-full h-full"
                            key={currentSource?.url}
                        >
                            {watchData?.subtitles?.map((sub: any, i: number) => (
                                <track 
                                    key={i}
                                    kind="subtitles"
                                    src={`/api/stream-proxy?url=${encodeURIComponent(sub.url)}`}
                                    srcLang={sub.lang || 'en'}
                                    label={sub.lang || 'English'}
                                    default={sub.lang?.toLowerCase().includes('english') || sub.lang?.toLowerCase() === 'en'}
                                />
                            ))}
                        </video>
                    )}
                </div>

                {/* Controls & Info */}
                {!loading && !error && (
                    <div className="mt-6 sm:mt-8 flex flex-col md:flex-row gap-6 sm:gap-8">
                        <div className="flex-1">
                            <div className="bg-slate-900/50 border border-slate-800 p-5 sm:p-8 rounded-2xl sm:rounded-3xl backdrop-blur-md">
                                <h2 className="text-xl sm:text-2xl font-black mb-2">
                                    {watchData?.title || `Episode ${episodeNumber}`}
                                </h2>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-6">
                                    <p className="text-slate-400 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                        System Status: <span className="text-sky-400 font-bold uppercase text-[10px] sm:text-xs tracking-widest">Optimal</span>
                                    </p>
                                    <p className="text-slate-400 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-sky-500 rounded-full" />
                                        Connection: <span className="text-sky-400 font-bold uppercase text-[10px] sm:text-xs tracking-widest">Encrypted</span>
                                    </p>
                                </div>
                                
                                <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
                                    <Link 
                                        to={`/anime/watch/${anilistId}/${parseInt(episodeNumber || '1') + 1}`}
                                        className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all shadow-lg shadow-sky-500/20 text-center"
                                    >
                                        Next Episode
                                    </Link>
                                    <button className="w-full sm:w-auto px-8 py-3 sm:py-0 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl sm:rounded-2xl transition-all">
                                        Download
                                    </button>
                                </div>
                            </div>
                        </div>

                        {watchData?.sources && watchData.sources.length > 0 && (
                            <div className="w-full md:w-80">
                                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl backdrop-blur-md">
                                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                                        <Settings size={18} className="text-sky-400" /> Select Server
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
                                                Server {idx + 1} - {s.quality?.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="mt-4 text-[10px] text-slate-500 uppercase tracking-widest text-center">
                                        Automatic server failover enabled
                                    </p>
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
