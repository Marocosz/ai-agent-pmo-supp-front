import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// 1. Importe nosso novo Provedor de Sessão
import { SessionProvider } from './contexts/SessionContext.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 2. Envolva o <App /> com o <SessionProvider /> */}
    <SessionProvider>
      <App />
    </SessionProvider>
  </React.StrictMode>,
)