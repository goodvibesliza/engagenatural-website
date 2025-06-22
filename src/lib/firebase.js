// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyCO65kN7L3OR7VnORRwYZckzoUEUJAoJQg',
  authDomain: 'engagenatural-app.firebaseapp.com',
  projectId: 'engagenatural-app',
 HEAD
  storageBucket: 'engagenatural-app.firebasestorage.com', // Fixed storage bucket URL back again
  
 45e98bda1adc8316fd1aafe7d008c91beb679771
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

