import type { FirebaseApp } from 'firebase/app'
import type { Firestore } from 'firebase/firestore'
import type { Auth } from 'firebase/auth'
import type { FirebaseStorage } from 'firebase/storage'
import type { Functions } from 'firebase/functions'

export declare const app: FirebaseApp | undefined
export declare const db: Firestore | undefined
export declare const auth: Auth | undefined
export declare const storage: FirebaseStorage | undefined
export declare const functions: Functions | undefined
export declare const isLocalhost: boolean
