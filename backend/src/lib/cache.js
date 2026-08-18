import { createClient } from 'redis'
import logger from './logger.js'

let client
let connectPromise
let isReady = false
let redisUnavailable = false

// Keep a small process-local fallback so caching still helps when Redis is not
// provisioned. Railway commonly runs one API instance; this also makes local
// development useful without requiring a Redis service.
const memoryCache = new Map()
const inFlight = new Map()

function memoryExpiry(options = {}) {
    const seconds = Number(options.EX ?? options.ex ?? 60)
    return Number.isFinite(seconds) && seconds > 0 ? Date.now() + seconds * 1000 : 0
}

function readMemory(key) {
    const entry = memoryCache.get(key)
    if (!entry) return null
    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
        memoryCache.delete(key)
        return null
    }
    return entry.value
}

async function setupRedis() {
    if (!process.env.REDIS_URL || redisUnavailable) return false
    if (isReady && client) return true
    if (connectPromise) return connectPromise

    client = createClient({ url: process.env.REDIS_URL })
    client.on('error', (err) => {
        logger.warn('Redis client error', { error: err.message })
        isReady = false
    })
    client.on('ready', () => {
        logger.info('Redis client ready')
        isReady = true
    })

    connectPromise = client.connect()
        .then(() => {
            isReady = true
            return true
        })
        .catch((error) => {
            redisUnavailable = true
            isReady = false
            logger.warn('Failed to connect to Redis, using process-local cache', {
                error: error.message,
            })
            return false
        })
        .finally(() => {
            connectPromise = null
        })

    return connectPromise
}

async function get(key) {
    if (await setupRedis()) {
        try {
            const value = await client.get(key)
            if (value !== null) return value
        } catch {
            isReady = false
        }
    }
    return readMemory(key)
}

async function set(key, value, options = {}) {
    memoryCache.set(key, { value, expiresAt: memoryExpiry(options) })

    if (await setupRedis()) {
        try {
            await client.set(key, value, options)
        } catch {
            isReady = false
        }
    }
}

async function del(key) {
    memoryCache.delete(key)
    if (await setupRedis()) {
        try {
            await client.del(key)
        } catch {
            isReady = false
        }
    }
}

export const cache = {
    get,
    set,
    del,
    async getJson(key) {
        const value = await get(key)
        if (value === null) return null
        try {
            return JSON.parse(value)
        } catch {
            await del(key)
            return null
        }
    },
    async setJson(key, value, options = {}) {
        return set(key, JSON.stringify(value), options)
    },
    async getOrSetJson(key, loader, options = {}) {
        const cached = await this.getJson(key)
        if (cached !== null) return { value: cached, hit: true }

        if (inFlight.has(key)) {
            return { value: await inFlight.get(key), hit: false }
        }

        const pending = Promise.resolve().then(loader)
        inFlight.set(key, pending)
        try {
            const value = await pending
            await this.setJson(key, value, options)
            return { value, hit: false }
        } finally {
            inFlight.delete(key)
        }
    },
}
