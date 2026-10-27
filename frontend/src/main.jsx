import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'
import './index.css'
import { initKokoroFromPreference } from './lib/speech/kokoroClient'

if (import.meta.env.PROD) {
    const updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
            updateSW(true)
        },
    })
}

// Downloads nothing unless the learner has already turned the natural voice on.
initKokoroFromPreference()

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
