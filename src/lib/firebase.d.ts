declare module '../lib/firebase.js' {
  import type { FirebaseApp } from 'firebase/app';
  import type { Auth } from 'firebase/auth';
  import type { Firestore } from 'firebase/firestore';
  import type { FirebaseStorage } from 'firebase/storage';
  import type { Functions } from 'firebase/functions';

  export const isLocalhost: boolean;
  export const app: FirebaseApp | undefined;
  export const auth: Auth | undefined;
  export const db: Firestore | undefined;
  export const storage: FirebaseStorage | undefined;
  export const functions: Functions | undefined;
}