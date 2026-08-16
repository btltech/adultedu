import { useEffect, useState } from 'react'
import { Eye, Type, X } from 'lucide-react'

const TEXT_SIZE_KEY = 'adultedu:text-size'
const CONTRAST_KEY = 'adultedu:contrast'

function applyDisplayPreferences(textSize, contrast) {
    document.documentElement.dataset.textSize = textSize
    document.documentElement.dataset.contrast = contrast
}

function getStoredPreference(key, fallback) {
    try {
        return typeof window.localStorage?.getItem === 'function'
            ? window.localStorage.getItem(key) || fallback
            : fallback
    } catch {
        return fallback
    }
}

function setStoredPreference(key, value) {
    try {
        if (typeof window.localStorage?.setItem === 'function') {
            window.localStorage.setItem(key, value)
        }
    } catch {
        // Browsers can deny storage access; the visual preference still applies for the current page.
    }
}

// Controlled panel — trigger and positioning are owned by the parent (Header).
// Pass isOpen + onClose from outside.
export default function DisplayPreferences({ isOpen, onClose }) {
    const [textSize, setTextSize] = useState('default')
    const [contrast, setContrast] = useState('default')

    useEffect(() => {
        const savedTextSize = getStoredPreference(TEXT_SIZE_KEY, 'default')
        const savedContrast = getStoredPreference(CONTRAST_KEY, 'default')
        setTextSize(savedTextSize)
        setContrast(savedContrast)
        applyDisplayPreferences(savedTextSize, savedContrast)
    }, [])

    useEffect(() => {
        applyDisplayPreferences(textSize, contrast)
        setStoredPreference(TEXT_SIZE_KEY, textSize)
        setStoredPreference(CONTRAST_KEY, contrast)
    }, [contrast, textSize])

    if (!isOpen) return null

    return (
        <div
            id="display-preferences-panel"
            className="absolute right-0 top-full mt-2 z-50 editorial-panel w-72 p-5 shadow-2xl"
        >
            <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-300">Accessibility</p>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close display settings"
                    className="text-dark-500 hover:text-dark-200 transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
            <h2 className="mt-2 text-sm font-semibold text-dark-50">Adjust reading comfort</h2>
            <p className="mt-1 text-xs leading-5 text-dark-400">Settings are saved on this device.</p>

            <div className="mt-4 space-y-4">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-dark-200">
                        <Type className="h-3.5 w-3.5 text-accent-300" />
                        Text size
                    </div>
                    <div className="flex gap-2">
                        {[
                            { key: 'default', label: 'Standard' },
                            { key: 'large', label: 'Larger' },
                        ].map((option) => (
                            <button
                                key={option.key}
                                type="button"
                                onClick={() => setTextSize(option.key)}
                                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${textSize === option.key
                                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                                    : 'border border-dark-700 bg-dark-900/70 text-dark-300 hover:border-dark-500 hover:text-dark-100'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-dark-200">
                        <Eye className="h-3.5 w-3.5 text-accent-300" />
                        Contrast
                    </div>
                    <div className="flex gap-2">
                        {[
                            { key: 'default', label: 'Standard' },
                            { key: 'high', label: 'High contrast' },
                        ].map((option) => (
                            <button
                                key={option.key}
                                type="button"
                                onClick={() => setContrast(option.key)}
                                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${contrast === option.key
                                    ? 'bg-accent-500 text-dark-950 shadow-lg shadow-accent-500/20'
                                    : 'border border-dark-700 bg-dark-900/70 text-dark-300 hover:border-dark-500 hover:text-dark-100'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}