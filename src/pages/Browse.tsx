import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, X, ChevronDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import MangaCard from '@/components/MangaCard'
import { searchManga, type ApiManga } from '@/lib/api'
import { GENRES } from '@/lib/types'
import { cn } from '@/lib/utils'

type SortOption = 'popular' | 'latest' | 'rating' | 'newest' | 'az'

const sortOptions: { label: string; value: SortOption }[] = [
    { label: 'Most Popular', value: 'popular' },
    { label: 'Latest Updates', value: 'latest' },
    { label: 'Top Rated', value: 'rating' },
    { label: 'Newest', value: 'newest' },
    { label: 'A-Z', value: 'az' },
]

const typeOptions = [
    { label: 'All Types', value: '' },
    { label: 'Manga', value: 'manga' },
    { label: 'Manhwa', value: 'manhwa' },
    { label: 'Manhua', value: 'manhua' },
]

const statusOptions = [
    { label: 'All Status', value: '' },
    { label: 'Ongoing', value: 'ongoing' },
    { label: 'Completed', value: 'completed' },
    { label: 'Hiatus', value: 'hiatus' },
]

export default function Browse() {
    const [searchParams] = useSearchParams()
    const [search, setSearch] = useState(searchParams.get('q') || '')
    const [sort, setSort] = useState<SortOption>((searchParams.get('sort') as SortOption) || 'popular')
    const [selectedType, setSelectedType] = useState(searchParams.get('type') || '')
    const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '')
    const [selectedGenres, setSelectedGenres] = useState<string[]>([])
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [results, setResults] = useState<ApiManga[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(0)

    const LIMIT = 20

    // Fetch data when filters change
    useEffect(() => {
        let cancelled = false
        setLoading(true)

        searchManga(search, {
            type: selectedType || undefined,
            status: selectedStatus || undefined,
            limit: LIMIT,
            offset: page * LIMIT,
        })
            .then(res => {
                if (!cancelled) {
                    setResults(res.data)
                    setTotal(res.total)
                }
            })
            .catch(err => {
                console.error('Search error:', err)
                if (!cancelled) setResults([])
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => { cancelled = true }
    }, [search, selectedType, selectedStatus, sort, page])

    const toggleGenre = (genre: string) => {
        setSelectedGenres(prev =>
            prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
        )
    }

    const clearFilters = () => {
        setSearch('')
        setSort('popular')
        setSelectedType('')
        setSelectedStatus('')
        setSelectedGenres([])
        setPage(0)
    }

    const hasFilters = selectedType !== '' || selectedStatus !== '' || selectedGenres.length > 0

    // Client-side genre filtering (MangaDex uses UUIDs for tags)
    const filteredResults = useMemo(() => {
        if (selectedGenres.length === 0) return results
        return results.filter(m => selectedGenres.some(g => m.genres.map(x => x.toLowerCase()).includes(g.toLowerCase())))
    }, [results, selectedGenres])

    const totalPages = Math.ceil(total / LIMIT)

    const FilterPanel = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-semibold mb-3">Type</h3>
                <div className="flex flex-wrap gap-2">
                    {typeOptions.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => { setSelectedType(opt.value); setPage(0) }}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                                selectedType === opt.value
                                    ? 'gradient-primary text-white'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                            )}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-sm font-semibold mb-3">Status</h3>
                <div className="flex flex-wrap gap-2">
                    {statusOptions.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => { setSelectedStatus(opt.value); setPage(0) }}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                                selectedStatus === opt.value
                                    ? 'gradient-primary text-white'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                            )}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-sm font-semibold mb-3">Genres</h3>
                <div className="flex flex-wrap gap-2">
                    {GENRES.map(genre => (
                        <button
                            key={genre}
                            onClick={() => toggleGenre(genre)}
                            className={cn(
                                'px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                                selectedGenres.includes(genre)
                                    ? 'bg-sky-500/15 border-sky-300 dark:border-sky-500/40 text-sky-600 dark:text-sky-400'
                                    : 'border-border text-muted-foreground hover:border-sky-200 dark:hover:border-sky-500/20 hover:text-foreground'
                            )}
                        >
                            {genre}
                        </button>
                    ))}
                </div>
            </div>

            {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                    <X className="w-4 h-4 mr-1" /> Clear Filters
                </Button>
            )}
        </div>
    )

    return (
        <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Browse Library</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {loading ? 'Searching...' : `${total.toLocaleString()} titles found`}
                    </p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by title, author..."
                        className="pl-9"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(0) }}
                    />
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <select
                            value={sort}
                            onChange={e => setSort(e.target.value as SortOption)}
                            className="appearance-none h-10 pl-3 pr-8 rounded-lg border border-border bg-background text-sm text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            {sortOptions.map(opt => (
                                <option key={opt.value} value={opt.value} className="bg-background">{opt.label}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                    <Button
                        variant={filtersOpen ? 'default' : 'outline'}
                        size="icon"
                        className="lg:hidden"
                        onClick={() => setFiltersOpen(!filtersOpen)}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {hasFilters && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="text-xs text-muted-foreground">Active filters:</span>
                    {selectedType && (
                        <Badge variant="info" className="text-xs capitalize cursor-pointer" onClick={() => setSelectedType('')}>
                            {selectedType} <X className="w-3 h-3 ml-1" />
                        </Badge>
                    )}
                    {selectedStatus && (
                        <Badge variant="info" className="text-xs capitalize cursor-pointer" onClick={() => setSelectedStatus('')}>
                            {selectedStatus} <X className="w-3 h-3 ml-1" />
                        </Badge>
                    )}
                    {selectedGenres.map(genre => (
                        <Badge key={genre} variant="info" className="text-xs cursor-pointer" onClick={() => toggleGenre(genre)}>
                            {genre} <X className="w-3 h-3 ml-1" />
                        </Badge>
                    ))}
                </div>
            )}

            <div className="flex gap-8">
                <aside className="hidden lg:block w-64 shrink-0">
                    <div className="sticky top-24 bg-card rounded-xl p-5 border border-border shadow-sm">
                        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4" /> Filters
                        </h2>
                        <FilterPanel />
                    </div>
                </aside>

                {filtersOpen && (
                    <div className="lg:hidden fixed inset-0 z-40">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setFiltersOpen(false)} />
                        <div className="absolute bottom-0 left-0 right-0 max-h-[70vh] bg-background border-t border-border rounded-t-2xl p-6 overflow-y-auto animate-fade-in">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold">Filters</h2>
                                <button onClick={() => setFiltersOpen(false)} className="text-muted-foreground hover:text-foreground">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <FilterPanel />
                        </div>
                    </div>
                )}

                <div className="flex-1">
                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="aspect-[3/4.5] rounded-xl" />
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : filteredResults.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-xl font-semibold text-muted-foreground mb-2">No titles found</p>
                            <p className="text-sm text-muted-foreground">Try adjusting your filters or search query.</p>
                            <Button variant="outline" className="mt-4" onClick={clearFilters}>Clear Filters</Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredResults.map(manga => (
                                <MangaCard key={manga.id} manga={manga} />
                            ))}
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-10">
                            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
                            <span className="text-sm text-muted-foreground px-3">
                                Page {page + 1} of {totalPages}
                            </span>
                            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
