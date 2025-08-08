import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Import global styles after Tailwind base so that brand overrides win the cascade
import './App.css'
import App from "./App.jsx";
import './lib/firebase' // Import Firebase configuration

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
