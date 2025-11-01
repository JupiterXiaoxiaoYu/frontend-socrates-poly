import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { setProviderConfig, setRpcUrl } from 'zkwasm-minirollup-browser'
import App from './App.tsx'
import './index.css'

// Configure the provider before app initialization - must be called before DelphinusReactProvider
setProviderConfig({ type: 'rainbow' });
setRpcUrl(); // Will use VITE_ZKWASM_RPC_URL from .env or default

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
