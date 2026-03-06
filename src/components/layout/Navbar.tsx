import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Search, Menu, X, BookOpen, User, Bell, Sun, Moon, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTheme } from '@/lib/ThemeContext'
import { useAuth } from '@/lib/AuthContext'
import { cn } from '@/lib/utils'
import MobileDrawer from './MobileDrawer'

const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Browse', path: '/browse' },
    { label: 'Manga', path: '/browse?type=manga' },
    { label: 'Manhwa', path: '/browse?type=manhwa' },
    { label: 'Manhua', path: '/browse?type=manhua' },
]

export default function Navbar() {
    const [searchOpen, setSearchOpen] = useState(false)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const location = useLocation()
    const { theme, toggleTheme } = useTheme()
    const { user } = useAuth()

    return (
        <>
            <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2.5 shrink-0">
                            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-sky-500/20">
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gradient hidden sm:inline">ManhwaWeb</span>
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden lg:flex items-center gap-1">
                            {navLinks.map(link => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={cn(
                                        'px-3.5 py-2 rounded-lg text-sm font-medium transition-colors',
                                        location.pathname === link.path
                                            ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                    )}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>

                        {/* Desktop Search + Actions */}
                        <div className="hidden lg:flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search titles..."
                                    className="w-64 pl-9"
                                />
                            </div>

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
                        <div className="flex lg:hidden items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleTheme}
                                className="text-muted-foreground"
                            >
                                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground"
                                onClick={() => setSearchOpen(!searchOpen)}
                            >
                                {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground"
                                onClick={() => setDrawerOpen(true)}
                            >
                                <Menu className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Mobile Search Expand */}
                    {searchOpen && (
                        <div className="lg:hidden pb-3 animate-fade-in">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search manga, manhwa, manhua..."
                                    className="w-full pl-9"
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        </>
    )
}
