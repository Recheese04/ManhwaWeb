import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Search, Menu, X, User, Bell, Sun, Moon, LogIn, Loader2, Star, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useTheme } from '@/lib/ThemeContext'
import { useAuth } from '@/lib/AuthContext'
import { searchManga, type ApiManga } from '@/lib/api'
import { cn } from '@/lib/utils'
import MobileDrawer from './MobileDrawer'

const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Browse', path: '/browse' },
]

const typeFilters = [
    { label: 'Manga', value: 'manga', color: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-500/30' },
    { label: 'Manhwa', value: 'manhwa', color: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-500/30' },
    { label: 'Manhua', value: 'manhua', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30' },
]

// Search Autocomplete Component
function SearchAutocomplete({
    onClose,
    className,
    isMobile = false
}: {
    onClose: () => void,
    className?: string,
    isMobile?: boolean
}) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<ApiManga[]>([])
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                onClose()
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [onClose])

    useEffect(() => {
        if (!query.trim()) {
            setResults([])
            return
        }

        const timeoutId = setTimeout(() => {
            setLoading(true)
            searchManga(query, { limit: 5 })
                .then(res => setResults(res.data))
                .catch(console.error)
                .finally(() => setLoading(false))
        }, 500)

        return () => clearTimeout(timeoutId)
    }, [query])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (query.trim()) {
            navigate(`/browse?q=${encodeURIComponent(query.trim())}`)
            onClose()
            setQuery('')
        }
    }

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            <form onSubmit={handleSubmit}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search titles..."
                    className={cn("pl-9", isMobile ? "w-full" : "w-64")}
                    autoFocus={isMobile}
                />
            </form>

            {(query.trim().length > 0 || loading || results.length > 0) && (
                <div className="absolute top-full mt-2 left-0 right-0 lg:w-80 bg-background border border-border rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in-fast">
                    {loading ? (
                        <div className="flex items-center justify-center py-6 text-muted-foreground">
                            <Loader2 className="w-5 h-5 animate-spin text-sky-500" />
                        </div>
                    ) : results.length > 0 ? (
                        <div className="divide-y divide-border">
                            {results.map(manga => (
                                <Link
                                    key={manga.id}
                                    to={`/manga/${manga.slug}`}
                                    onClick={() => { onClose(); setQuery('') }}
                                    className="flex gap-3 p-3 hover:bg-muted transition-colors group"
                                >
                                    <div className="w-12 h-16 rounded overflow-hidden shrink-0 bg-muted">
                                        <img src={manga.cover} alt={manga.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                    </div>
                                    <div className="flex-1 min-w-0 py-0.5">
                                        <h4 className="font-medium text-sm line-clamp-2 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">{manga.title}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            {manga.rating > 0 && <span className="flex items-center gap-1 text-[10px] text-amber-500"><Star className="w-3 h-3 fill-amber-500" />{manga.rating}</span>}
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-muted-foreground/10 uppercase text-muted-foreground font-medium">{manga.type}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                            <div className="p-2 bg-muted/30">
                                <Button
                                    variant="ghost"
                                    className="w-full text-xs text-sky-600 dark:text-sky-400 font-medium"
                                    onClick={handleSubmit}
                                >
                                    See all results for "{query}"
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No titles found for "{query}"
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default function Navbar() {
    const [searchOpen, setSearchOpen] = useState(false)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const location = useLocation()

    const { theme, toggleTheme } = useTheme()
    const { user } = useAuth()

    // Check if current path matches a type filter
    const currentType = new URLSearchParams(location.search).get('type')

    return (
        <>
            <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/50">
                <div className="max-w-7xl mx-auto px-3 sm:px-6">
                    <div className="flex items-center justify-between h-14 sm:h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 shrink-0">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden shadow-lg shadow-sky-500/20">
                                <img src="/manhwaweb-logo.png" alt="ReCyGlen" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-lg sm:text-xl font-bold text-gradient">ReCyGlen</span>
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden lg:flex items-center gap-1">
                            {navLinks.map(link => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={cn(
                                        'px-3.5 py-2 rounded-lg text-sm font-medium transition-colors',
                                        location.pathname === link.path && !currentType
                                            ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                    )}
                                >
                                    {link.label}
                                </Link>
                            ))}

                            {/* Type filter pills */}
                            <div className="flex items-center gap-1 ml-1 pl-2 border-l border-border/50">
                                {typeFilters.map(filter => (
                                    <Link
                                        key={filter.value}
                                        to={`/browse?type=${filter.value}`}
                                        className={cn(
                                            'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200',
                                            currentType === filter.value
                                                ? filter.color
                                                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
                                        )}
                                    >
                                        {filter.label}
                                    </Link>
                                ))}
                            </div>
                        </nav>

                        {/* Desktop Search + Actions */}
                        <div className="hidden lg:flex items-center gap-2">
                            <SearchAutocomplete onClose={() => { }} />

                            {/* Dark mode toggle */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleTheme}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </Button>

                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                                <Bell className="w-5 h-5" />
                            </Button>

                            {user ? (
                                <Link to="/profile">
                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                                        {user.photoURL ? (
                                            <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full" />
                                        ) : (
                                            <User className="w-5 h-5" />
                                        )}
                                    </Button>
                                </Link>
                            ) : (
                                <Link to="/login">
                                    <Button size="sm" className="gap-1.5">
                                        <LogIn className="w-4 h-4" /> Sign In
                                    </Button>
                                </Link>
                            )}
                        </div>

                        {/* Mobile Actions */}
                        <div className="flex lg:hidden items-center gap-0.5">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleTheme}
                                className="text-muted-foreground h-9 w-9"
                            >
                                {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground h-9 w-9"
                                onClick={() => setSearchOpen(!searchOpen)}
                            >
                                {searchOpen ? <X className="w-4.5 h-4.5" /> : <Search className="w-4.5 h-4.5" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground h-9 w-9"
                                onClick={() => setDrawerOpen(true)}
                            >
                                <Menu className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Mobile Search Expand */}
                    {searchOpen && (
                        <div className="lg:hidden pb-3 animate-fade-in relative">
                            <SearchAutocomplete onClose={() => setSearchOpen(false)} className="w-full" isMobile />
                        </div>
                    )}

                    {/* Mobile Type Filter Pills — shown below search on mobile */}
                    <div className="lg:hidden flex items-center gap-1.5 pb-2 overflow-x-auto hide-scrollbar -mx-1 px-1">
                        {typeFilters.map(filter => (
                            <Link
                                key={filter.value}
                                to={`/browse?type=${filter.value}`}
                                className={cn(
                                    'px-3 py-1 rounded-full text-[11px] font-semibold border transition-all duration-200 whitespace-nowrap shrink-0',
                                    currentType === filter.value
                                        ? filter.color
                                        : 'border-border/60 text-muted-foreground hover:text-foreground'
                                )}
                            >
                                {filter.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </header>

            <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        </>
    )
}
