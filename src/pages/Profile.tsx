import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Heart, Clock, Settings, LogOut, Star, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import MangaCard from '@/components/MangaCard'
import { mockUser, getMangaById, formatDate } from '@/lib/mockData'
import { cn } from '@/lib/utils'

type TabType = 'reading' | 'bookmarks' | 'favorites' | 'settings'

export default function Profile() {
    const [activeTab, setActiveTab] = useState<TabType>('reading')

    const tabs: { label: string; value: TabType; icon: React.ElementType }[] = [
        { label: 'Continue Reading', value: 'reading', icon: BookOpen },
        { label: 'Bookmarks', value: 'bookmarks', icon: Clock },
        { label: 'Favorites', value: 'favorites', icon: Heart },
        { label: 'Settings', value: 'settings', icon: Settings },
    ]

    const readingList = mockUser.readingHistory
        .map(item => {
            const manga = getMangaById(item.mangaId)
            return manga ? { ...item, manga } : null
        })
        .filter(Boolean) as Array<{ mangaId: string; chapterId: string; chapterNumber: number; lastReadAt: string; progress: number; manga: NonNullable<ReturnType<typeof getMangaById>> }>

    const bookmarkedManga = mockUser.bookmarks.map(id => getMangaById(id)).filter(Boolean) as NonNullable<ReturnType<typeof getMangaById>>[]
    const favoriteManga = mockUser.favorites.map(id => getMangaById(id)).filter(Boolean) as NonNullable<ReturnType<typeof getMangaById>>[]

    return (
        <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* Profile Header */}
            <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 mb-8 shadow-sm">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative">
                        <img src={mockUser.avatar} alt={mockUser.username} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full ring-4 ring-sky-500/30" />
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full gradient-primary flex items-center justify-center">
                            <Star className="w-4 h-4 text-white fill-white" />
                        </div>
                    </div>
                    <div className="text-center sm:text-left flex-1">
                        <h1 className="text-2xl font-bold mb-1">{mockUser.username}</h1>
                        <p className="text-sm text-muted-foreground mb-3">{mockUser.email}</p>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                            <div className="text-center">
                                <p className="text-lg font-bold text-sky-600 dark:text-sky-400">{mockUser.readingHistory.length}</p>
                                <p className="text-xs text-muted-foreground">Reading</p>
                            </div>
                            <div className="w-px h-8 bg-border" />
                            <div className="text-center">
                                <p className="text-lg font-bold text-sky-600 dark:text-sky-400">{mockUser.bookmarks.length}</p>
                                <p className="text-xs text-muted-foreground">Bookmarks</p>
                            </div>
                            <div className="w-px h-8 bg-border" />
                            <div className="text-center">
                                <p className="text-lg font-bold text-sky-600 dark:text-sky-400">{mockUser.favorites.length}</p>
                                <p className="text-xs text-muted-foreground">Favorites</p>
                            </div>
                        </div>
                    </div>
                    <Button variant="outline" className="text-muted-foreground shrink-0">
                        <LogOut className="w-4 h-4" /> Sign Out
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar mb-8 pb-1">
                {tabs.map(tab => {
                    const Icon = tab.icon
                    return (
                        <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value)}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                                activeTab === tab.value
                                    ? 'gradient-primary text-white shadow-lg shadow-sky-500/25'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* Tab Content */}
            <div className="animate-fade-in">
                {activeTab === 'reading' && (
                    <div className="space-y-3">
                        {readingList.length === 0 ? (
                            <div className="text-center py-20 text-muted-foreground">
                                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p className="text-lg font-medium">No reading history</p>
                                <p className="text-sm">Start reading some titles!</p>
                            </div>
                        ) : (
                            readingList.map(item => (
                                <div key={item.mangaId} className="bg-card rounded-xl border border-border p-4 shadow-sm">
                                    <div className="flex gap-4">
                                        <Link to={`/manga/${item.manga.slug}`} className="shrink-0">
                                            <img src={item.manga.cover} alt={item.manga.title} className="w-16 h-24 rounded-lg object-cover ring-1 ring-border" />
                                        </Link>
                                        <div className="flex-1 min-w-0">
                                            <Link to={`/manga/${item.manga.slug}`}>
                                                <h3 className="font-semibold text-sm hover:text-sky-600 dark:hover:text-sky-400 transition-colors truncate">{item.manga.title}</h3>
                                            </Link>
                                            <p className="text-xs text-muted-foreground mt-1">Ch. {item.chapterNumber} · {formatDate(item.lastReadAt)}</p>
                                            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div className="h-full gradient-primary rounded-full" style={{ width: `${item.progress}%` }} />
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-xs text-muted-foreground">{item.progress}% complete</span>
                                                <Link to={`/manga/${item.manga.slug}/chapter/${item.chapterNumber}`}>
                                                    <Button size="sm" variant="ghost" className="text-sky-600 dark:text-sky-400 text-xs h-7 px-2">
                                                        Continue <ChevronRight className="w-3 h-3" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'bookmarks' && (
                    <div>
                        {bookmarkedManga.length === 0 ? (
                            <div className="text-center py-20 text-muted-foreground">
                                <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p className="text-lg font-medium">No bookmarks yet</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {bookmarkedManga.map(manga => <MangaCard key={manga.id} manga={manga} />)}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'favorites' && (
                    <div>
                        {favoriteManga.length === 0 ? (
                            <div className="text-center py-20 text-muted-foreground">
                                <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p className="text-lg font-medium">No favorites yet</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {favoriteManga.map(manga => <MangaCard key={manga.id} manga={manga} />)}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="max-w-lg">
                        <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-6">
                            <h2 className="text-lg font-semibold">Account Settings</h2>
                            <div className="space-y-4">
                                <div><label className="text-sm text-muted-foreground mb-1.5 block">Username</label><Input defaultValue={mockUser.username} /></div>
                                <div><label className="text-sm text-muted-foreground mb-1.5 block">Email</label><Input defaultValue={mockUser.email} type="email" /></div>
                                <div><label className="text-sm text-muted-foreground mb-1.5 block">Current Password</label><Input type="password" placeholder="Enter current password" /></div>
                                <div><label className="text-sm text-muted-foreground mb-1.5 block">New Password</label><Input type="password" placeholder="Enter new password" /></div>
                            </div>
                            <div className="pt-4 border-t border-border">
                                <h3 className="text-sm font-semibold mb-3">Reading Preferences</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Default reading mode</span><Badge variant="secondary">Vertical Scroll</Badge></div>
                                    <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Reader background</span><Badge variant="secondary">Dark</Badge></div>
                                    <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Content language</span><Badge variant="secondary">English</Badge></div>
                                </div>
                            </div>
                            <Button className="w-full">Save Changes</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
