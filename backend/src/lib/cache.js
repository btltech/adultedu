import { createClient } from 'redis';
import logger from './logger.js';

let client;
let isReady = false;

// Only initialize if REDIS_URL or we want to try default localhost
const setupRedis = async () => {
    if (!client) {
        client = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });

        client.on('error', (err) => {
            logger.warn('Redis client error', {
                error: err.message,
            });
            isReady = false;
        });

        client.on('ready', () => {
            logger.info('Redis client ready');
            isReady = true;
        });

        try {
            await client.connect();
        } catch (e) {
            logger.warn('Failed to connect to Redis, caching disabled', {
                error: e.message,
            });
        }
    }
};

export const cache = {
    get: async (key) => {
        if (!isReady) return null;
        try {
            return await client.get(key);
        } catch (e) {
            return null;
        }
    },
    set: async (key, value, options) => {
        if (!isReady) return;
        try {
            await client.set(key, value, options);
        } catch (e) {
            // Ignore cache errors
        }
    },
    del: async (key) => {
        if (!isReady) return;
        try {
            await client.del(key);
        } catch (e) {
            // Ignore
        }
    }
};
