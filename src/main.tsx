import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './app/globals.css'

const companyName = import.meta.env.VITE_COMPANY_NAME || 'Dashboard'
document.title = `${companyName} - Dashviewer`

const faviconUrl = import.meta.env.VITE_FAVICON_URL
if (faviconUrl) {
  const link = document.querySelector("link[rel='icon']") as HTMLLinkElement
  if (link) link.href = faviconUrl
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
