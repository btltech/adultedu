import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToRouteTarget() {
    const location = useLocation()

    useEffect(() => {
        if (!location.hash) return undefined

        let targetId
        try {
            targetId = decodeURIComponent(location.hash.slice(1))
        } catch {
            return undefined
        }

        let observer
        let timeoutId
        let frameId

        const revealTarget = () => {
            const target = document.getElementById(targetId)
            if (!target) return false

            target.scrollIntoView({ block: 'start', behavior: 'auto' })
            observer?.disconnect()
            window.clearTimeout(timeoutId)
            return true
        }

        frameId = window.requestAnimationFrame(() => {
            if (revealTarget()) return

            // Route components and their API-backed content can arrive after the
            // URL changes. Wait for the named destination instead of silently
            // leaving the learner at the top of the new page.
            observer = new MutationObserver(revealTarget)
            observer.observe(document.body, { childList: true, subtree: true })
            timeoutId = window.setTimeout(() => observer.disconnect(), 4000)
        })

        return () => {
            window.cancelAnimationFrame(frameId)
            window.clearTimeout(timeoutId)
            observer?.disconnect()
        }
    }, [location.hash, location.pathname, location.search])

    return null
}
