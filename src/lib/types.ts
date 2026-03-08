export type MangaType = 'manga' | 'manhwa' | 'manhua'
export type MangaStatus = 'ongoing' | 'completed' | 'hiatus'

export interface Manga {
    id: string
    title: string
    altTitles?: string[]
    slug: string
    cover: string
    banner?: string
    type: MangaType
    status: MangaStatus
    author: string
    artist: string
    genres: string[]
    rating: number
    views: number
    bookmarks: number
    synopsis: string
    chapters: Chapter[]
    updatedAt: string
    createdAt: string
}

export interface Chapter {
    id: string
    number: number
    title: string
    pages: number
    releasedAt: string
    isRead?: boolean
}

export interface UserProfile {
    id: string
    username: string
    avatar: string
    email: string
    joinedAt: string
    readingHistory: ReadingHistoryItem[]
    bookmarks: string[]
    favorites: string[]
}

export interface ReadingHistoryItem {
    mangaId: string
    chapterId: string
    chapterNumber: number
    lastReadAt: string
    progress: number
}

export interface Review {
    id: string
    userId: string
    username: string
    avatar: string
    mangaId: string
    rating: number
    content: string
    createdAt: string
    likes: number
}

export const GENRES = [
    'Thriller', 'Reincarnation', 'Sci-Fi', 'Time Travel', 'Genderswap',
    'Loli', 'Traditional Games', 'Historical', 'Monsters', 'Action',
    'Demons', 'Psychological', 'Ghosts', 'Animals', 'Romance',
    'Ninja', 'Comedy', 'Mecha', 'Boys\' Love', 'Incest',
    'Crime', 'Survival', 'Zombies', 'Reverse Harem', 'Sports',
    'Superhero', 'Martial Arts', 'Samurai', 'Magical Girls', 'Mafia',
    'Adventure', 'Virtual Reality', 'Office Workers', 'Video Games', 'Post-Apocalyptic',
    'Crossdressing', 'Magic', 'Girls\' Love', 'Harem', 'Military',
    'Wuxia', 'Isekai', 'Philosophical', 'Drama', 'Medical',
    'School Life', 'Mahjong', 'Horror', 'Fantasy', 'Villainess',
    'Vampires', 'Delinquents', 'Monster Girls', 'Shota', 'Police',
    'Slice of Life', 'Aliens', 'Cooking', 'Supernatural', 'Mystery',
    'Music', 'Tragedy', 'Gyaru', 'Shounen', 'Shoujo',
    'Seinen', 'Josei',
] as const

export type Genre = typeof GENRES[number]
