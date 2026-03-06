import { createContext, useContext, useEffect, useState } from 'react'
import {
    User,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile,
} from 'firebase/auth'
import { firebaseAuth, googleProvider } from './firebase'

interface AuthContextType {
    user: User | null
    loading: boolean
    login: (email: string, password: string) => Promise<void>
    signup: (email: string, password: string, username: string) => Promise<void>
    loginWithGoogle: () => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => { },
    signup: async () => { },
    loginWithGoogle: async () => { },
    logout: async () => { },
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
            setUser(user)
            setLoading(false)
        })
        return unsubscribe
    }, [])

    const login = async (email: string, password: string) => {
        await signInWithEmailAndPassword(firebaseAuth, email, password)
    }

    const signup = async (email: string, password: string, username: string) => {
        const result = await createUserWithEmailAndPassword(firebaseAuth, email, password)
        await updateProfile(result.user, { displayName: username })
    }

    const loginWithGoogle = async () => {
        await signInWithPopup(firebaseAuth, googleProvider)
    }

    const logout = async () => {
        await signOut(firebaseAuth)
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, loginWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
