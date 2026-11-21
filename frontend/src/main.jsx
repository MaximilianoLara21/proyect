import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Aquí se muestra la página dentro del espacio principal del sitio.
createRoot(document.getElementById('root')).render(
  // React revisa la página mientras la construimos para ayudar a encontrar errores.
  <StrictMode>
    <App />
  </StrictMode>,
)
