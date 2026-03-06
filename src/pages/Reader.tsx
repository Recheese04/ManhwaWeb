import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Settings, Bookmark, Home, List, Minus, Plus, Maximize, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getMangaBySlug } from '@/lib/mockData'
import { cn } from '@/lib/utils'

export default function Reader() {
    const { slug, chapterNum } = useParams<{ slug: string; chapterNum: string }>()
    const navigate = useNavigate()
    const manga = getMangaBySlug(slug || '')
    const currentChapter = parseInt(chapterNum || '1')

    const [showControls, setShowControls] = useState(true)
    const [showSettings, setShowSettings] = useState(false)
    const [showChapterList, setShowChapterList] = useState(false)
    const [zoom, setZoom] = useState(100)
    const [readerTheme, setReaderTheme] = useState<'dark' | 'light'>('dark')
    const [progress, setProgress] = useState(0)
    const contentRef = useRef<HTMLDivElement>(null)
    const hideTimeout = useRef<ReturnType<typeof setTimeout>>()

    const chapter = manga?.chapters.find(ch => ch.number === currentChapter)
    const pageCount = chapter?.pages || 20

    const handleScroll = useCallback(() => {
        if (contentRef.current) {
            const el = contentRef.current
            const scrollPercent = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100
            setProgress(Math.min(100, Math.max(0, scrollPercent)))
        }
    }, [])

    useEffect(() => {
        const el = contentRef.current
        if (el) {
            el.addEventListener('scroll', handleScroll)
            return () => el.removeEventListener('scroll', handleScroll)
        }
    }, [handleScroll])

    const autoHideControls = useCallback(() => {
        if (hideTimeout.current) clearTimeout(hideTimeout.current)
        setShowControls(true)
        hideTimeout.current = setTimeout(() => setShowControls(false), 3000)
    }, [])

    useEffect(() => {
        autoHideControls()
        return () => { if (hideTimeout.current) clearTimeout(hideTimeout.current) }
    }, [autoHideControls])

    if (!manga) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2 text-white">Title Not Found</h1>
                    <Link to="/browse"><Button variant="outline">Browse Library</Button></Link>
                </div>
            </div>
        )
    }

    const isLight = readerTheme === 'light'
    const hasPrev = currentChapter > 1
    const hasNext = currentChapter < manga.chapters.length

    const goToChapter = (num: number) => {
        navigate(`/manga/${slug}/chapter/${num}`)
        if (contentRef.current) contentRef.current.scrollTop = 0
    }

    const readerPages = Array.from({ length: Math.min(pageCount, 12) }, (_, i) => i + 1)

    return (
        <div className={cn('fixed inset-0 flex flex-col', isLight ? 'bg-gray-100' : 'bg-black')} onMouseMove={autoHideControls}>
            {/* Progress Bar */}
            <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-black/20">
                <div className="h-full gradient-primary transition-all duration-150 ease-out" style={{ width: `${progress}%` }} />
            </div>

            {/* Top Bar */}
            <div className={cn(
                'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
                showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
            )}>
                <div className={cn(
                    'flex items-center justify-between px-4 py-3 backdrop-blur-xl',
                    isLight ? 'bg-white/90 border-b border-gray-200' : 'bg-gray-950/90 border-b border-white/10'
                )}>
                    <div className="flex items-center gap-3 min-w-0">
                        <Link to={`/manga/${slug}`}>
                            <Button variant="ghost" size="icon" className={isLight ? 'text-gray-600 hover:text-black' : 'text-white/70 hover:text-white'}>
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div className="min-w-0">
                            <p className={cn('text-sm font-medium truncate', isLight ? 'text-black' : 'text-white')}>{manga.title}</p>
                            <p className={cn('text-xs', isLight ? 'text-gray-500' : 'text-white/50')}>Chapter {currentChapter}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className={isLight ? 'text-gray-600' : 'text-white/70'} onClick={() => setShowChapterList(!showChapterList)}>
                            <List className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className={isLight ? 'text-gray-600' : 'text-white/70'}>
                            <Bookmark className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className={isLight ? 'text-gray-600' : 'text-white/70'} onClick={() => setShowSettings(!showSettings)}>
                            <Settings className="w-5 h-5" />
                        </Button>
                        <Link to="/">
                            <Button variant="ghost" size="icon" className={isLight ? 'text-gray-600' : 'text-white/70'}>
                                <Home className="w-5 h-5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <div className={cn(
                    'fixed top-16 right-4 z-40 w-64 rounded-xl p-4 shadow-2xl animate-fade-in-fast border',
                    isLight ? 'bg-white border-gray-200' : 'bg-gray-900 border-white/10'
                )}>
                    <h3 className={cn('text-sm font-semibold mb-4', isLight ? 'text-black' : 'text-white')}>Reading Settings</h3>
                    <div className="space-y-4">
                        <div>
                            <p className={cn('text-xs mb-2', isLight ? 'text-gray-500' : 'text-white/50')}>Zoom: {zoom}%</p>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.max(50, zoom - 10))}>
                                    <Minus className="w-3 h-3" />
                                </Button>
                                <div className={cn('flex-1 h-1.5 rounded-full overflow-hidden', isLight ? 'bg-gray-200' : 'bg-white/10')}>
                                    <div className="h-full gradient-primary rounded-full" style={{ width: `${((zoom - 50) / 150) * 100}%` }} />
                                </div>
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.min(200, zoom + 10))}>
                                    <Plus className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className={cn('text-xs', isLight ? 'text-gray-500' : 'text-white/50')}>Reader Theme</span>
                            <Button variant="outline" size="sm" onClick={() => setReaderTheme(isLight ? 'dark' : 'light')} className="gap-1.5">
                                {isLight ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
                                {isLight ? 'Dark' : 'Light'}
                            </Button>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className={cn('text-xs', isLight ? 'text-gray-500' : 'text-white/50')}>Fullscreen</span>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => {
                                if (document.fullscreenElement) document.exitFullscreen()
                                else document.documentElement.requestFullscreen()
                            }}>
                                <Maximize className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Chapter List Panel */}
            {showChapterList && (
                <div className={cn(
                    'fixed top-16 left-4 z-40 w-72 max-h-[60vh] rounded-xl shadow-2xl overflow-y-auto animate-fade-in-fast border',
                    isLight ? 'bg-white border-gray-200' : 'bg-gray-900 border-white/10'
                )}>
                    <div className={cn('p-3 border-b sticky top-0 backdrop-blur-xl', isLight ? 'bg-white/90 border-gray-200' : 'bg-gray-900/90 border-white/10')}>
                        <h3 className={cn('text-sm font-semibold', isLight ? 'text-black' : 'text-white')}>Chapters</h3>
                    </div>
                    <div className="p-2">
                        {manga.chapters.slice(0, 30).map(ch => (
                            <button
                                key={ch.id}
                                onClick={() => { goToChapter(ch.number); setShowChapterList(false) }}
                                className={cn(
                                    'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                                    ch.number === currentChapter
                                        ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 font-medium'
                                        : isLight
                                            ? 'text-gray-600 hover:bg-gray-100'
                                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                                )}
                            >
                                Chapter {ch.number}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Reader Content */}
            <div
                ref={contentRef}
                className="flex-1 overflow-y-auto"
                onClick={() => { setShowControls(!showControls); setShowSettings(false); setShowChapterList(false) }}
            >
                <div className="flex flex-col items-center py-16" style={{ zoom: `${zoom}%` }}>
                    {readerPages.map(pageNum => (
                        <div
                            key={pageNum}
                            className={cn(
                                'w-full max-w-3xl aspect-[2/3] flex items-center justify-center border-b',
                                isLight ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-white/5'
                            )}
                        >
                            <div className="text-center">
                                <div className={cn('text-6xl font-bold mb-2 opacity-10', isLight ? 'text-gray-400' : 'text-white')}>
                                    {pageNum}
                                </div>
                                <p className={cn('text-sm', isLight ? 'text-gray-400' : 'text-white/20')}>
                                    Chapter {currentChapter} — Page {pageNum}
                                </p>
                            </div>
                        </div>
                    ))}

                    <div className="w-full max-w-3xl py-16 text-center">
                        <p className={cn('text-lg font-semibold mb-2', isLight ? 'text-black' : 'text-white')}>End of Chapter {currentChapter}</p>
                        <p className={cn('text-sm mb-6', isLight ? 'text-gray-500' : 'text-white/50')}>
                            {hasNext ? 'Continue to the next chapter' : 'You\'ve reached the latest chapter'}
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            {hasPrev && (
                                <Button variant="outline" onClick={() => goToChapter(currentChapter - 1)}>
                                    <ChevronLeft className="w-4 h-4" /> Previous
                                </Button>
                            )}
                            {hasNext && (
                                <Button onClick={() => goToChapter(currentChapter + 1)}>
                                    Next Chapter <ChevronRight className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className={cn(
                'fixed bottom-0 left-0 right-0 z-40 transition-all duration-300',
                showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
            )}>
                <div className={cn(
                    'flex items-center justify-between px-4 py-3 backdrop-blur-xl',
                    isLight ? 'bg-white/90 border-t border-gray-200' : 'bg-gray-950/90 border-t border-white/10'
                )}>
                    <Button variant="ghost" size="sm" disabled={!hasPrev} onClick={() => goToChapter(currentChapter - 1)}
                        className={isLight ? 'text-gray-600' : 'text-white/70'}>
                        <ChevronLeft className="w-4 h-4" /> Prev
                    </Button>
                    <span className={cn('text-sm font-medium', isLight ? 'text-black' : 'text-white')}>
                        Ch. {currentChapter} / {manga.chapters.length}
                    </span>
                    <Button variant="ghost" size="sm" disabled={!hasNext} onClick={() => goToChapter(currentChapter + 1)}
                        className={isLight ? 'text-gray-600' : 'text-white/70'}>
                        Next <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
