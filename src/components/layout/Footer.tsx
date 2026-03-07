import { Link } from 'react-router-dom'
import { Github, Twitter, Mail, Heart } from 'lucide-react'

const footerLinks = {
    Browse: [
        { label: 'Manga', path: '/browse?type=manga' },
        { label: 'Manhwa', path: '/browse?type=manhwa' },
        { label: 'Manhua', path: '/browse?type=manhua' },
        { label: 'Latest Updates', path: '/browse?sort=latest' },
        { label: 'Popular', path: '/browse?sort=popular' },
    ],
    Community: [
        { label: 'Discord', path: '#' },
        { label: 'Forums', path: '#' },
        { label: 'Blog', path: '#' },
        { label: 'FAQ', path: '#' },
    ],
    Legal: [
        { label: 'Terms of Service', path: '#' },
        { label: 'Privacy Policy', path: '#' },
        { label: 'DMCA', path: '#' },
        { label: 'Contact', path: '#' },
    ],
}

export default function Footer() {
    return (
        <footer className="border-t border-border bg-card/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
                    {/* Brand */}
                    <div className="col-span-2 sm:col-span-2 md:col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg overflow-hidden shadow-md">
                                <img src="/manhwaweb-logo.png" alt="ReCyGlen" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-lg font-bold text-gradient">ReCyGlen</span>
                        </Link>
                        <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                            Your premium destination for reading manga, manhwa, and manhua online. Discover thousands of titles.
                        </p>
                        <div className="flex items-center gap-3">
                            <a href="#" className="text-muted-foreground hover:text-sky-500 transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                <Github className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                <Mail className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Link Columns */}
                    {Object.entries(footerLinks).map(([title, links]) => (
                        <div key={title}>
                            <h3 className="text-sm font-semibold mb-3">{title}</h3>
                            <ul className="space-y-2">
                                {links.map(link => (
                                    <li key={link.label}>
                                        <Link
                                            to={link.path}
                                            className="text-sm text-muted-foreground hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom */}
                <div className="mt-8 sm:mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                    <p className="text-xs text-muted-foreground text-center sm:text-left">
                        © {new Date().getFullYear()} ReCyGlen. All rights reserved.
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 text-center sm:text-right">
                        Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> Rechie James Postanes, Glenmark Sandigan, and Cydric Sabalboro.
                    </p>
                </div>
            </div>
        </footer>
    )
}
