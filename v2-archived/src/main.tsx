import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { GlobalStateProvider } from './context/GlobalState'

createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <GlobalStateProvider>
            <App />
        </GlobalStateProvider>
    </React.StrictMode>,
)
