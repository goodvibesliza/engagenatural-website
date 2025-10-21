import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import App from "./App.jsx";  // <-- Change back to regular App.jsx
import '@/lib/firebase' // Import Firebase configuration
import { BrandFonts } from '@/brand/typography'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrandFonts />
    <App />
  </StrictMode>,
)

// Register FCM service worker (only in browsers that support it)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    try {
      navigator.serviceWorker.register('/firebase-messaging-sw.js');
    } catch (e) {
      // no-op
    }
  });
}