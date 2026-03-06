import { Routes, Route } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Home from '@/pages/Home'
import Browse from '@/pages/Browse'
import TitleDetail from '@/pages/TitleDetail'
import Reader from '@/pages/Reader'
import Profile from '@/pages/Profile'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'

function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Navbar />
            <main className="min-h-screen">{children}</main>
            <Footer />
        </>
    )
}

export default function App() {
    return (
        <Routes>
            {/* Reader has its own fullscreen layout */}
            <Route path="/manga/:slug/chapter/:chapterNum" element={<Reader />} />

            {/* Auth pages with minimal layout */}
            <Route path="/login" element={<MainLayout><Login /></MainLayout>} />
            <Route path="/signup" element={<MainLayout><Signup /></MainLayout>} />

            {/* All other pages share the Navbar + Footer layout */}
            <Route
                path="*"
                element={
                    <MainLayout>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/browse" element={<Browse />} />
                            <Route path="/manga/:slug" element={<TitleDetail />} />
                            <Route path="/profile" element={<Profile />} />
                        </Routes>
                    </MainLayout>
                }
            />
        </Routes>
    )
}
