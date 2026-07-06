import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { DBProvider } from './context/DBContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DBProvider>
      <App />
    </DBProvider>
  </StrictMode>,
)
