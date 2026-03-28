import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import EnterDetails from './pages/EnterDetails'
import Platform from './pages/Platform'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/enter" element={<EnterDetails />} />
        <Route path="/platform" element={<Platform />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
