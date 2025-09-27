// Ambient Firebase module declarations for app code.
// Ensures imports like `import { db } from '*lib/firebase'` work in TS/JS.

declare module "*lib/firebase" {
  import type { FirebaseApp } from "firebase/app";
  import type { Auth } from "firebase/auth";
  import type { Firestore } from "firebase/firestore";
  import type { Functions } from "firebase/functions";
  import type { FirebaseStorage } from "firebase/storage";

  export const app: FirebaseApp;
  export const auth: Auth;
  export const db: Firestore;
  export const functions: Functions;
  export const storage: FirebaseStorage;
  export const isLocalhost: boolean;
}

declare module "@/lib/firebase" {
  export * from "*lib/firebase";
}
