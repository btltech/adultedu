import { api } from './api'

export const LEARNER_DB_NAME = 'adultedu-learner'
export const LEARNER_DB_VERSION = 1
export const LEARNER_EXPORT_FORMAT = 'adultedu-learning-data'
export const LEARNER_EXPORT_VERSION = 1

const STORE_NAMES = [
    'learner',
    'lessonProgress',
    'pathwayProgress',
    'quizAttempts',
    'bookmarks',
    'preferences',
    'activity',
    'syncMetadata',
]

const memoryStores = new Map(STORE_NAMES.map((name) => [name, new Map()]))
let databasePromise = null
let storageBackend = 'unknown'

function nowIso() {
    return new Date().toISOString()
}

function randomId(prefix) {
    const value = globalThis.crypto?.randomUUID?.()
        || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
    return `${prefix}_${value}`
}

function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value))
}

function notifyStorageChange() {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('adultedu:learner-storage-changed'))
}

function openDatabase() {
    if (databasePromise) return databasePromise
    if (typeof indexedDB === 'undefined') {
        storageBackend = 'memory'
        return Promise.resolve(null)
    }

    databasePromise = new Promise((resolve) => {
        const request = indexedDB.open(LEARNER_DB_NAME, LEARNER_DB_VERSION)

        request.onupgradeneeded = () => {
            const db = request.result

            if (!db.objectStoreNames.contains('learner')) {
                db.createObjectStore('learner', { keyPath: 'id' })
            }
            if (!db.objectStoreNames.contains('lessonProgress')) {
                const store = db.createObjectStore('lessonProgress', { keyPath: 'lessonId' })
                store.createIndex('trackId', 'trackId')
                store.createIndex('topicId', 'topicId')
                store.createIndex('updatedAt', 'updatedAt')
            }
            if (!db.objectStoreNames.contains('pathwayProgress')) {
                const store = db.createObjectStore('pathwayProgress', { keyPath: 'trackId' })
                store.createIndex('updatedAt', 'updatedAt')
            }
            if (!db.objectStoreNames.contains('quizAttempts')) {
                const store = db.createObjectStore('quizAttempts', { keyPath: 'id' })
                store.createIndex('quizId', 'quizId')
                store.createIndex('questionId', 'questionId')
                store.createIndex('createdAt', 'createdAt')
            }
            if (!db.objectStoreNames.contains('bookmarks')) {
                const store = db.createObjectStore('bookmarks', { keyPath: 'itemId' })
                store.createIndex('createdAt', 'createdAt')
            }
            if (!db.objectStoreNames.contains('preferences')) {
                db.createObjectStore('preferences', { keyPath: 'key' })
            }
            if (!db.objectStoreNames.contains('activity')) {
                const store = db.createObjectStore('activity', { keyPath: 'id' })
                store.createIndex('occurredAt', 'occurredAt')
            }
            if (!db.objectStoreNames.contains('syncMetadata')) {
                db.createObjectStore('syncMetadata', { keyPath: 'key' })
            }
        }

        request.onsuccess = () => {
            storageBackend = 'indexeddb'
            resolve(request.result)
        }
        request.onerror = () => {
            storageBackend = 'memory'
            console.warn('IndexedDB unavailable; learner progress will last for this page only.', request.error)
            resolve(null)
        }
        request.onblocked = () => {
            storageBackend = 'memory'
            resolve(null)
        }
    })

    return databasePromise
}

async function run(storeName, mode, operation) {
    const db = await openDatabase()
    if (!db) {
        const store = memoryStores.get(storeName)
        return operation({
            get: (key) => clone(store.get(key)),
            put: (value) => store.set(value[storeName === 'learner' ? 'id' : keyPathFor(storeName)], clone(value)),
            delete: (key) => store.delete(key),
            getAll: () => [...store.values()].map(clone),
            clear: () => store.clear(),
        }, true)
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, mode)
        const store = transaction.objectStore(storeName)
        let result

        try {
            result = operation(store, false)
        } catch (error) {
            reject(error)
            return
        }

        if (result && typeof result.onsuccess !== 'undefined') {
            result.onsuccess = () => resolve(result.result)
            result.onerror = () => reject(result.error)
            return
        }

        transaction.oncomplete = () => resolve(result)
        transaction.onerror = () => reject(transaction.error)
        transaction.onabort = () => reject(transaction.error || new Error('IndexedDB transaction aborted'))
    })
}

function keyPathFor(storeName) {
    return {
        lessonProgress: 'lessonId',
        pathwayProgress: 'trackId',
        quizAttempts: 'id',
        bookmarks: 'itemId',
        preferences: 'key',
        activity: 'id',
        syncMetadata: 'key',
    }[storeName]
}

async function get(storeName, key) {
    return run(storeName, 'readonly', (store, memory) => memory ? store.get(key) : store.get(key))
}

async function getAll(storeName) {
    return run(storeName, 'readonly', (store, memory) => memory ? store.getAll() : store.getAll())
}

async function put(storeName, value) {
    await run(storeName, 'readwrite', (store, memory) => memory ? store.put(value) : store.put(value))
    return value
}

async function clearStore(storeName) {
    return run(storeName, 'readwrite', (store, memory) => memory ? store.clear() : store.clear())
}

async function appendActivity(type, metadata = {}) {
    const entry = {
        id: randomId('activity'),
        type,
        metadata,
        occurredAt: nowIso(),
    }
    await put('activity', entry)
    return entry
}

function normaliseArray(value) {
    return Array.isArray(value) ? value.slice(0, 10_000).filter((entry) => entry && typeof entry === 'object' && !Array.isArray(entry)) : []
}

function safeString(value, max = 2_000) {
    return typeof value === 'string' ? value.slice(0, max) : ''
}

function safeInternalRoute(value) {
    const route = safeString(value, 500)
    if (!route.startsWith('/') || route.startsWith('//') || route.includes('\\')) return ''
    if ([...route].some((character) => {
        const code = character.charCodeAt(0)
        return code <= 31 || code === 127
    })) return ''
    return route
}

function validateExport(payload) {
    if (!payload || typeof payload !== 'object') throw new Error('Learning data must be a JSON object.')
    if (payload.format !== LEARNER_EXPORT_FORMAT || payload.version !== LEARNER_EXPORT_VERSION) {
        throw new Error('This is not a supported AdultEdu learning-data export.')
    }
    if (!payload.data || typeof payload.data !== 'object') throw new Error('Learning data is missing.')

    return {
        ...payload,
        data: {
            learner: payload.data.learner && typeof payload.data.learner === 'object' ? {
                ...payload.data.learner,
                id: 'current',
                localLearnerId: safeString(payload.data.learner.localLearnerId, 120),
            } : null,
            lessonProgress: normaliseArray(payload.data.lessonProgress).map((entry) => ({
                ...entry,
                lessonId: safeString(entry.lessonId, 120), trackId: safeString(entry.trackId, 120), topicId: safeString(entry.topicId, 120),
                lessonTitle: safeString(entry.lessonTitle, 300), trackTitle: safeString(entry.trackTitle, 300), topicTitle: safeString(entry.topicTitle, 300),
                completed: !!entry.completed,
            })).filter((entry) => entry.lessonId && entry.trackId),
            pathwayProgress: normaliseArray(payload.data.pathwayProgress).map((entry) => ({
                ...entry,
                trackId: safeString(entry.trackId, 120), trackSlug: safeString(entry.trackSlug, 160), trackTitle: safeString(entry.trackTitle, 300),
                topicId: safeString(entry.topicId, 120), topicTitle: safeString(entry.topicTitle, 300), currentLessonId: safeString(entry.currentLessonId, 120),
                currentLessonTitle: safeString(entry.currentLessonTitle, 300), lastRoute: safeInternalRoute(entry.lastRoute),
                completedLessonIds: [...new Set((Array.isArray(entry.completedLessonIds) ? entry.completedLessonIds : []).slice(0, 10_000).map((id) => safeString(id, 120)).filter(Boolean))],
            })).filter((entry) => entry.trackId),
            quizAttempts: normaliseArray(payload.data.quizAttempts).map((entry) => ({
                ...entry,
                id: safeString(entry.id, 120), quizId: safeString(entry.quizId || entry.topicId, 120), questionId: safeString(entry.questionId, 120),
                topicId: safeString(entry.topicId, 120), trackId: safeString(entry.trackId, 120), trackSlug: safeString(entry.trackSlug, 160),
                trackTitle: safeString(entry.trackTitle, 300), topicTitle: safeString(entry.topicTitle, 300), explanation: safeString(entry.explanation, 5_000),
                isCorrect: !!entry.isCorrect,
            })).filter((entry) => entry.id && entry.questionId),
            bookmarks: normaliseArray(payload.data.bookmarks).map((entry) => ({
                ...entry,
                itemId: safeString(entry.itemId, 120), type: safeString(entry.type, 50), title: safeString(entry.title, 300), subtitle: safeString(entry.subtitle, 300),
                route: safeInternalRoute(entry.route), trackId: safeString(entry.trackId, 120),
            })).filter((entry) => entry.itemId && entry.route),
            preferences: normaliseArray(payload.data.preferences).map((entry) => ({ key: safeString(entry.key, 100), value: entry.value, updatedAt: entry.updatedAt }))
                .filter((entry) => entry.key && ['string', 'number', 'boolean'].includes(typeof entry.value)),
            activity: normaliseArray(payload.data.activity).map((entry) => ({ ...entry, id: safeString(entry.id, 120), type: safeString(entry.type, 80) })).filter((entry) => entry.id && entry.type),
            syncMetadata: normaliseArray(payload.data.syncMetadata).map((entry) => ({ ...entry, key: safeString(entry.key, 160) })).filter((entry) => entry.key),
        },
    }
}

function latest(left, right) {
    if (!left) return right
    if (!right) return left
    return String(right.updatedAt || right.createdAt || '') > String(left.updatedAt || left.createdAt || '') ? right : left
}

export function mergeLearnerExports(localPayload, cloudPayload) {
    const local = validateExport(localPayload)
    const cloud = validateExport(cloudPayload)
    const localData = local.data
    const cloudData = cloud.data

    const mergeByKey = (left, right, key, resolver = latest) => {
        const merged = new Map(left.map((entry) => [entry[key], entry]))
        right.forEach((entry) => {
            if (!entry[key]) return
            merged.set(entry[key], resolver(merged.get(entry[key]), entry))
        })
        return [...merged.values()]
    }

    const lessonProgress = mergeByKey(localData.lessonProgress, cloudData.lessonProgress, 'lessonId', (a, b) => {
        if (!a) return b
        if (!b) return a
        if (a.completed && !b.completed) return { ...latest(a, b), completed: true, completedAt: a.completedAt }
        if (b.completed && !a.completed) return { ...latest(a, b), completed: true, completedAt: b.completedAt }
        return latest(a, b)
    })

    const pathwayProgress = mergeByKey(localData.pathwayProgress, cloudData.pathwayProgress, 'trackId', (a, b) => {
        if (!a) return b
        const completedLessonIds = [...new Set([...(a.completedLessonIds || []), ...(b.completedLessonIds || [])])]
        const preferred = latest(a, b)
        return {
            ...preferred,
            completedLessonIds,
            totalLessons: Math.max(Number(a.totalLessons) || 0, Number(b.totalLessons) || 0),
            quizAttemptCount: Math.max(Number(a.quizAttemptCount) || 0, Number(b.quizAttemptCount) || 0),
        }
    })

    return {
        format: LEARNER_EXPORT_FORMAT,
        version: LEARNER_EXPORT_VERSION,
        exportedAt: nowIso(),
        data: {
            learner: localData.learner || cloudData.learner,
            lessonProgress,
            pathwayProgress,
            quizAttempts: mergeByKey(localData.quizAttempts, cloudData.quizAttempts, 'id'),
            bookmarks: mergeByKey(localData.bookmarks, cloudData.bookmarks, 'itemId'),
            // An explicit cloud preference wins; otherwise the local preference is retained.
            preferences: mergeByKey(localData.preferences, cloudData.preferences, 'key', (a, b) => b || a),
            activity: mergeByKey(localData.activity, cloudData.activity, 'id'),
            syncMetadata: mergeByKey(localData.syncMetadata, cloudData.syncMetadata, 'key'),
        },
    }
}

export class LocalLearnerProgressStore {
    async getLearner() {
        let learner = await get('learner', 'current')
        if (!learner) {
            const timestamp = nowIso()
            learner = {
                id: 'current',
                localLearnerId: randomId('learner_local'),
                schemaVersion: LEARNER_DB_VERSION,
                createdAt: timestamp,
                updatedAt: timestamp,
            }
            await put('learner', learner)
        }
        return learner
    }

    getPathwayProgress(trackId) {
        return get('pathwayProgress', trackId)
    }

    getLessonProgress(lessonId) {
        return get('lessonProgress', lessonId)
    }

    async saveCurrentPosition(input) {
        await this.getLearner()
        const timestamp = nowIso()
        const existing = await get('lessonProgress', input.lessonId)
        await put('lessonProgress', {
            ...existing,
            ...input,
            completed: !!existing?.completed,
            startedAt: existing?.startedAt || timestamp,
            updatedAt: timestamp,
        })

        const pathway = await get('pathwayProgress', input.trackId)
        await put('pathwayProgress', {
            ...pathway,
            trackId: input.trackId,
            trackSlug: input.trackSlug,
            trackTitle: input.trackTitle,
            topicId: input.topicId,
            topicTitle: input.topicTitle,
            currentLessonId: input.lessonId,
            currentLessonTitle: input.lessonTitle,
            lastRoute: `/lesson/${input.lessonId}`,
            completedLessonIds: pathway?.completedLessonIds || [],
            totalLessons: Math.max(Number(pathway?.totalLessons) || 0, Number(input.totalLessons) || 0),
            quizAttemptCount: Number(pathway?.quizAttemptCount) || 0,
            createdAt: pathway?.createdAt || timestamp,
            updatedAt: timestamp,
        })
        await appendActivity('lesson_started', { lessonId: input.lessonId, trackId: input.trackId, route: `/lesson/${input.lessonId}` })
    }

    async completeLesson(input) {
        await this.saveCurrentPosition(input)
        const timestamp = nowIso()
        const existing = await get('lessonProgress', input.lessonId)
        await put('lessonProgress', {
            ...existing,
            ...input,
            completed: true,
            completedAt: existing?.completedAt || timestamp,
            updatedAt: timestamp,
        })

        const pathway = await get('pathwayProgress', input.trackId)
        const completedLessonIds = [...new Set([...(pathway?.completedLessonIds || []), input.lessonId])]
        await put('pathwayProgress', {
            ...pathway,
            completedLessonIds,
            totalLessons: Math.max(Number(pathway?.totalLessons) || 0, Number(input.totalLessons) || 0),
            updatedAt: timestamp,
        })
        await appendActivity('lesson_completed', { lessonId: input.lessonId, trackId: input.trackId, route: `/lesson/${input.lessonId}` })
    }

    async saveQuizAttempt(input) {
        await this.getLearner()
        const timestamp = input.createdAt || nowIso()
        const attempt = {
            ...input,
            id: input.id || randomId('attempt'),
            quizId: input.quizId || input.topicId,
            createdAt: timestamp,
            updatedAt: input.updatedAt || timestamp,
        }
        await put('quizAttempts', attempt)

        if (input.trackId) {
            const pathway = await get('pathwayProgress', input.trackId)
            const attempts = (await getAll('quizAttempts')).filter((entry) => entry.trackId === input.trackId)
            await put('pathwayProgress', {
                ...pathway,
                trackId: input.trackId,
                trackSlug: input.trackSlug || pathway?.trackSlug,
                trackTitle: input.trackTitle || pathway?.trackTitle,
                topicId: input.topicId,
                topicTitle: input.topicTitle || pathway?.topicTitle,
                lastRoute: `/practice/${input.topicId}`,
                completedLessonIds: pathway?.completedLessonIds || [],
                totalLessons: Number(pathway?.totalLessons) || 0,
                quizAttemptCount: attempts.length,
                createdAt: pathway?.createdAt || timestamp,
                updatedAt: timestamp,
            })
        }
        await appendActivity('practice_answered', { questionId: input.questionId, topicId: input.topicId, trackId: input.trackId, isCorrect: !!input.isCorrect })
        return attempt
    }

    async getQuizAttempts(quizId) {
        const attempts = await getAll('quizAttempts')
        return attempts.filter((entry) => entry.quizId === quizId || entry.topicId === quizId)
    }

    async addBookmark(input) {
        const timestamp = nowIso()
        const route = safeInternalRoute(input.route)
        if (!route) throw new Error('Bookmarks must point to an AdultEdu page.')
        await put('bookmarks', { ...input, route, itemId: input.itemId, createdAt: input.createdAt || timestamp, updatedAt: timestamp })
        await appendActivity('bookmark_added', { itemId: input.itemId, route })
    }

    async removeBookmark(itemId) {
        const existing = await get('bookmarks', itemId)
        if (!existing) return
        const timestamp = nowIso()
        await put('bookmarks', { ...existing, deletedAt: timestamp, updatedAt: timestamp })
        await appendActivity('bookmark_removed', { itemId })
    }

    async getBookmarks() {
        return (await getAll('bookmarks')).filter((bookmark) => !bookmark.deletedAt)
    }

    async getPreferences() {
        const rows = await getAll('preferences')
        return Object.fromEntries(rows.map((row) => [row.key, row.value]))
    }

    async savePreferences(input) {
        const timestamp = nowIso()
        await Promise.all(Object.entries(input).map(([key, value]) => put('preferences', { key, value, updatedAt: timestamp })))
    }

    async exportData() {
        const learner = await this.getLearner()
        const data = { learner }
        for (const storeName of STORE_NAMES.filter((name) => name !== 'learner')) {
            data[storeName] = await getAll(storeName)
        }
        return { format: LEARNER_EXPORT_FORMAT, version: LEARNER_EXPORT_VERSION, exportedAt: nowIso(), data }
    }

    async importData(payload, { merge = true } = {}) {
        const incoming = validateExport(payload)
        const data = merge ? mergeLearnerExports(await this.exportData(), incoming).data : incoming.data

        if (data.learner) await put('learner', { ...data.learner, id: 'current', updatedAt: nowIso() })
        for (const storeName of STORE_NAMES.filter((name) => name !== 'learner')) {
            for (const entry of data[storeName] || []) await put(storeName, entry)
        }
        return this.exportData()
    }

    async markSynced(userId) {
        const timestamp = nowIso()
        await put('syncMetadata', { key: `user:${userId}`, userId, status: 'synced', syncedAt: timestamp, updatedAt: timestamp })
        const learner = await this.getLearner()
        await put('learner', { ...learner, lastSuccessfulSyncAt: timestamp, updatedAt: timestamp })
        notifyStorageChange()
    }

    async markBackupSucceeded() {
        const timestamp = nowIso()
        const learner = await this.getLearner()
        await put('learner', { ...learner, lastSuccessfulBackupAt: timestamp, updatedAt: timestamp })
        await put('syncMetadata', { key: 'backup:last', status: 'backed-up', backedUpAt: timestamp, updatedAt: timestamp })
        notifyStorageChange()
    }

    async getStorageStatus() {
        const learner = await this.getLearner()
        return {
            persistent: storageBackend === 'indexeddb',
            backend: storageBackend,
            lastSuccessfulBackupAt: learner.lastSuccessfulBackupAt || null,
            lastSuccessfulSyncAt: learner.lastSuccessfulSyncAt || null,
        }
    }

    async clearAccountBoundLearningData() {
        for (const storeName of ['learner', 'lessonProgress', 'pathwayProgress', 'quizAttempts', 'bookmarks', 'activity', 'syncMetadata']) {
            await clearStore(storeName)
        }
        await this.getLearner()
        notifyStorageChange()
    }
}

export class CloudLearnerProgressStore {
    async exportData() {
        return api('/learner-state')
    }

    async merge(payload) {
        return api('/learner-state/merge', { method: 'POST', body: payload })
    }

    async getPathwayProgress(trackId) {
        const snapshot = await this.exportData()
        return snapshot.data.pathwayProgress.find((entry) => entry.trackId === trackId) || null
    }

    async getLessonProgress(lessonId) {
        const snapshot = await this.exportData()
        return snapshot.data.lessonProgress.find((entry) => entry.lessonId === lessonId) || null
    }

    completeLesson(input) {
        const timestamp = nowIso()
        return this.merge(exportDelta({ lessonProgress: [{ ...input, completed: true, completedAt: timestamp, updatedAt: timestamp }] }))
    }

    saveQuizAttempt(input) {
        const timestamp = input.createdAt || nowIso()
        return this.merge(exportDelta({ quizAttempts: [{ ...input, id: input.id || randomId('attempt'), createdAt: timestamp, updatedAt: timestamp }] }))
    }

    async getQuizAttempts(quizId) {
        const snapshot = await this.exportData()
        return snapshot.data.quizAttempts.filter((entry) => entry.quizId === quizId || entry.topicId === quizId)
    }

    addBookmark(input) {
        const timestamp = nowIso()
        return this.merge(exportDelta({ bookmarks: [{ ...input, createdAt: input.createdAt || timestamp, updatedAt: timestamp }] }))
    }

    removeBookmark(itemId) {
        const timestamp = nowIso()
        return this.merge(exportDelta({ bookmarks: [{ itemId, route: '/', deletedAt: timestamp, updatedAt: timestamp }] }))
    }

    async getBookmarks() {
        const snapshot = await this.exportData()
        return snapshot.data.bookmarks.filter((bookmark) => !bookmark.deletedAt)
    }

    async getPreferences() {
        const snapshot = await this.exportData()
        return Object.fromEntries(snapshot.data.preferences.map((entry) => [entry.key, entry.value]))
    }

    savePreferences(input) {
        return api('/learner-state/preferences', { method: 'PATCH', body: { preferences: input } })
    }
}

function exportDelta(data) {
    return {
        format: LEARNER_EXPORT_FORMAT,
        version: LEARNER_EXPORT_VERSION,
        exportedAt: nowIso(),
        data: {
            learner: null,
            lessonProgress: [], pathwayProgress: [], quizAttempts: [], bookmarks: [],
            preferences: [], activity: [], syncMetadata: [],
            ...data,
        },
    }
}

export const localLearnerProgressStore = new LocalLearnerProgressStore()
export const cloudLearnerProgressStore = new CloudLearnerProgressStore()

export async function syncLocalProgressToCloud() {
    const local = await localLearnerProgressStore.exportData()
    const result = await cloudLearnerProgressStore.merge(local)
    if (!result?.data || result.format !== LEARNER_EXPORT_FORMAT) {
        throw new Error('AdultEdu could not verify the saved learning data.')
    }
    await localLearnerProgressStore.importData(result)
    if (result.userId) await localLearnerProgressStore.markSynced(result.userId)
    return result
}

export async function resetLearnerProgressForTests() {
    databasePromise = null
    storageBackend = 'unknown'
    memoryStores.forEach((store) => store.clear())
}
