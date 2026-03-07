import { Link, useLocation } from 'react-router-dom'
import { X, Home, Library, BookOpen, User, Heart, Clock, Settings } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { cn } from '@/lib/utils'

interface MobileDrawerProps {
    open: boolean
    onClose: () => void
}

const drawerLinks = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Browse Library', path: '/browse', icon: Library },
    { label: 'Manga', path: '/browse?type=manga', icon: BookOpen },
    { label: 'Manhwa', path: '/browse?type=manhwa', icon: BookOpen },
    { label: 'Manhua', path: '/browse?type=manhua', icon: BookOpen },
]

const userLinks = [
    { label: 'Profile', path: '/profile', icon: User },
    { label: 'Favorites', path: '/profile?tab=favorites', icon: Heart },
    { label: 'History', path: '/profile?tab=history', icon: Clock },
    { label: 'Settings', path: '/profile?tab=settings', icon: Settings },
]

export default function MobileDrawer({ open, onClose }: MobileDrawerProps) {
    const location = useLocation()
    const { user } = useAuth()

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    'fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300',
                    open ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={cn(
                    'fixed top-0 right-0 h-full w-[280px] max-w-[85vw] bg-background border-l border-border z-50 transform transition-transform duration-300 flex flex-col shadow-2xl',
                    open ? 'translate-x-0' : 'translate-x-full'
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg overflow-hidden shadow-md">
                            <img src="/manhwaweb-logo.png" alt="ReCyGlen" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-lg font-bold text-gradient">ReCyGlen</span>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Links */}
                <nav className="flex-1 overflow-y-auto py-4">
                    <div className="px-3 mb-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Browse</p>
                        {drawerLinks.map(link => {
                            const Icon = link.icon
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={onClose}
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                        location.pathname === link.path
                                            ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    {link.label}
                                </Link>
                            )
                        })}
                    </div>

                    <div className="mx-3 border-t border-border my-3" />

                    <div className="px-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Account</p>
                        {userLinks.map(link => {
                            const Icon = link.icon
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={onClose}
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                        location.pathname === link.path
                                            ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    {link.label}
                                </Link>
                            )
                        })}
                    </div>
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-border">
                    {user ? (
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-sky-500/20 flex items-center justify-center">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full" />
                                ) : (
                                    <User className="w-4 h-4 text-sky-500" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{user.displayName || 'User'}</p>
                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                        </div>
                    ) : (
                        <Link to="/login" onClick={onClose} className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg gradient-primary text-white text-sm font-medium">
                            Sign In
                        </Link>
                    )}
                </div>
            </div>
        </>
    )
}
