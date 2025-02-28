import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { init as initEmailJS } from '@emailjs/browser'
import './index.css'
import App from './App.tsx'

// Initialize EmailJS with your public key
initEmailJS(import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
