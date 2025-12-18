import { useCallback, useRef } from 'react'
import { api } from '../lib/api'

/**
 * Hook for tracking analytics events
 * Debounces events to avoid spamming the API
 */
export function useTrackEvent() {
    const pendingEvents = useRef([])
    const flushTimeout = useRef(null)

    const flush = useCallback(async () => {
        if (pendingEvents.current.length === 0) return

        const events = [...pendingEvents.current]
        pendingEvents.current = []

        // Send events in parallel
        try {
            await Promise.all(
                events.map(event =>
                    api('/events', {
                        method: 'POST',
                        body: event
                    }).catch(() => { }) // Silently ignore errors for analytics
                )
            )
        } catch {
            // Silently fail - analytics shouldn't break the app
        }
    }, [])

    const trackEvent = useCallback((eventType, metadata = {}) => {
        pendingEvents.current.push({
            eventType,
            metadata: {
                ...metadata,
                timestamp: Date.now(),
                path: window.location.pathname
            }
        })

        // Debounce: flush after 2 seconds of no new events
        if (flushTimeout.current) {
            clearTimeout(flushTimeout.current)
        }
        flushTimeout.current = setTimeout(flush, 2000)
    }, [flush])

    // Immediate flush for important events
    const trackEventImmediate = useCallback(async (eventType, metadata = {}) => {
        try {
            await api('/events', {
                method: 'POST',
                body: {
                    eventType,
                    metadata: {
                        ...metadata,
                        timestamp: Date.now(),
                        path: window.location.pathname
                    }
                }
            })
        } catch {
            // Silently fail
        }
    }, [])

    return { trackEvent, trackEventImmediate }
}

// Event type constants
export const EventTypes = {
    PAGE_VIEW: 'page_view',
    QUESTION_START: 'question_start',
    QUESTION_SUBMIT: 'question_submit',
    QUESTION_CORRECT: 'question_correct',
    QUESTION_INCORRECT: 'question_incorrect',
    TRACK_ENROLL: 'track_enroll',
    HINT_USED: 'hint_used',
    SESSION_START: 'session_start',
    SESSION_END: 'session_end'
}
