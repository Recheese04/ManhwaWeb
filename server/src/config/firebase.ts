import admin from 'firebase-admin'
import dotenv from 'dotenv'
import { readFileSync, existsSync } from 'fs'

dotenv.config()

function initializeFirebase() {
    // Skip initialization if already initialized
    if (admin.apps.length > 0) return admin

    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH

    // Option 1: Use service account JSON file
    if (serviceAccountPath && existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'))
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        })
        console.log('✅ Firebase initialized with service account file')
        return admin
    }

    // Option 2: Use individual env vars
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        })
        console.log('✅ Firebase initialized with env vars')
        return admin
    }

    // Option 3: No Firebase (runs without auth/firestore)
    console.warn('⚠️  No Firebase credentials found. Running without Firebase auth/Firestore.')
    console.warn('   Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_PROJECT_ID in .env')
    return null
}

export const firebaseAdmin = initializeFirebase()
export const db = firebaseAdmin ? admin.firestore() : null
export const auth = firebaseAdmin ? admin.auth() : null
