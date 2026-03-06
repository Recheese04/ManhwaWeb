import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
    apiKey: "AIzaSyD8_QjwqcFLK-ODKPSo3mrboSGiLAJoCzI",
    authDomain: "manhwaweb-3d41e.firebaseapp.com",
    projectId: "manhwaweb-3d41e",
    storageBucket: "manhwaweb-3d41e.firebasestorage.app",
    messagingSenderId: "338111456669",
    appId: "1:338111456669:web:b513c97b85015df8b47b74",
    measurementId: "G-24X48QGJMY",
}

const app = initializeApp(firebaseConfig)
export const firebaseAuth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
