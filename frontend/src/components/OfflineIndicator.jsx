import { useState, useEffect } from 'react'
import { WifiOff } from 'lucide-react'

export default function OfflineIndicator() {
    const [isOffline, setIsOffline] = useState(!navigator.onLine)

    useEffect(() => {
        const handleOnline = () => setIsOffline(false)
        const handleOffline = () => setIsOffline(true)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    if (!isOffline) return null

    return (
        <div className="fixed bottom-4 left-4 z-50 bg-amber-500 text-dark-900 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
            <WifiOff size={18} />
            <span className="text-sm font-medium">You're offline - some features may be limited</span>
        </div>
    )
}
