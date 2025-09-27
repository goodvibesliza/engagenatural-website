import type { FirebaseApp } from 'firebase/app'
import type { Firestore } from 'firebase/firestore'
import type { Auth } from 'firebase/auth'
import type { FirebaseStorage } from 'firebase/storage'
import type { Functions } from 'firebase/functions'

declare module '*lib/firebase' {
	export const app: FirebaseApp | undefined
	export const db: Firestore | undefined
	export const auth: Auth | undefined
	export const storage: FirebaseStorage | undefined
	export const functions: Functions | undefined
	export const isLocalhost: boolean
}
