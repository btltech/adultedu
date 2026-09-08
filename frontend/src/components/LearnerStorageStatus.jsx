import { useEffect, useMemo, useState } from 'react'
import { Check, Cloud, CloudOff, HardDrive } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { localLearnerProgressStore } from '../lib/learnerProgress'

const LEARNING_ROUTES = ['/tracks', '/track/', '/topic/', '/lesson/', '/practice/', '/progress']

function relativeTime(timestamp) {
    if (!timestamp) return null
    const elapsedSeconds = Math.max(0, Math.round((Date.now() - new Date(timestamp).getTime()) / 1000))
    if (elapsedSeconds < 60) return 'just now'
    const minutes = Math.floor(elapsedSeconds / 60)
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
    const days = Math.floor(hours / 24)
    return `${days} day${days === 1 ? '' : 's'} ago`
}

export default function LearnerStorageStatus() {
    const location = useLocation()
    const auth = useAuth()
    const [storage, setStorage] = useState(null)
    const isLearningRoute = LEARNING_ROUTES.some((route) => route.endsWith('/')
        ? location.pathname.startsWith(route)
        : location.pathname === route)

    useEffect(() => {
        if (!isLearningRoute) return undefined
        let active = true
        const refresh = () => {
            localLearnerProgressStore.getStorageStatus()
                .then((next) => { if (active) setStorage(next) })
                .catch(() => { if (active) setStorage({ persistent: false, backend: 'memory' }) })
        }

        refresh()
        window.addEventListener('adultedu:learner-storage-changed', refresh)
        return () => {
            active = false
            window.removeEventListener('adultedu:learner-storage-changed', refresh)
        }
    }, [isLearningRoute, location.pathname])

    const content = useMemo(() => {
        if (!storage) return null
        if (!storage.persistent) {
            return {
                Icon: CloudOff,
                message: 'Progress is temporary in this browsing mode',
                detail: 'Use an account or export a backup before closing this browser.',
                warning: true,
            }
        }
        if (!auth.isAuthenticated) {
            const backedUp = relativeTime(storage.lastSuccessfulBackupAt)
            return {
                Icon: HardDrive,
                message: 'Saved on this device',
                detail: backedUp ? `Last backed up ${backedUp}` : null,
            }
        }
        if (auth.progressSync?.status === 'syncing') {
            return { Icon: Cloud, message: 'Saving your progress…', detail: null }
        }
        if (auth.progressSync?.status === 'failed') {
            return {
                Icon: CloudOff,
                message: 'Saved on this device · Sync pending',
                detail: 'Your local progress is safe.',
                warning: true,
            }
        }
        const synced = relativeTime(storage.lastSuccessfulSyncAt)
        return {
            Icon: Cloud,
            message: 'Saved on this device',
            detail: synced ? `Last synced ${synced}` : null,
        }
    }, [auth.isAuthenticated, auth.progressSync?.status, storage])

    if (!isLearningRoute || auth.loading || !content) return null

    const { Icon, message, detail, warning } = content
    return (
        <aside
            className={`border-b px-4 py-2 ${warning ? 'border-amber-400/20 bg-amber-400/5' : 'border-dark-800 bg-dark-950/60'}`}
            aria-label="Learning progress storage status"
        >
            <div className="container-app flex min-h-8 flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs">
                <div className="flex items-center gap-2" role="status" aria-live="polite">
                    <Icon className={`h-3.5 w-3.5 shrink-0 ${warning ? 'text-amber-300' : 'text-accent-300'}`} aria-hidden="true" />
                    <span className="font-medium text-dark-200">{message}</span>
                    {!warning && <Check className="h-3.5 w-3.5 text-accent-300" aria-hidden="true" />}
                    {detail && <span className="hidden text-dark-500 sm:inline">· {detail}</span>}
                </div>
                {!auth.isAuthenticated ? (
                    <Link
                        to="/signup"
                        state={{ from: { pathname: location.pathname, search: location.search, hash: location.hash } }}
                        className="font-semibold text-primary-300 hover:text-primary-200"
                    >
                        Protect your progress →
                    </Link>
                ) : auth.progressSync?.status === 'failed' ? (
                    <button type="button" onClick={auth.syncProgress} className="font-semibold text-primary-300 hover:text-primary-200">
                        Try sync again
                    </button>
                ) : null}
            </div>
        </aside>
    )
}
