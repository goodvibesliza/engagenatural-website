// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyCO65kN7L3OR7VnORRwYZckzoUEUJAoJQg',
  authDomain: 'engagenatural-app.firebaseapp.com',
  projectId: 'engagenatural-app',
  storageBucket: 'engagenatural-app.appspot.com', // Fixed storage bucket URL
  messagingSenderId: '314471463344',
  appId: '1:314471463344:web:db0916256301b9eb6fbe75',
  measurementId: 'G-62ZGD6VC8P'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;

