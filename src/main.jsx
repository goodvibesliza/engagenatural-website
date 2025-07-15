import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './UpdatedAppWithIntegration.jsx';
import './lib/firebase' // Import Firebase configuration

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
