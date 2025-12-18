import cors from 'cors'
import config from '../config/env.js'

export const corsMiddleware = cors({
    origin: config.isDev
        ? [config.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173']
        : config.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    // Allow CSRF header since the frontend echoes the cookie back on mutations
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
})

export default corsMiddleware
