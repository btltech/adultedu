import 'dotenv/config'
import { execFileSync } from 'node:child_process'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required to prepare the test database.')

const host = new URL(databaseUrl).hostname
const allowedHosts = new Set(['localhost', '127.0.0.1', '::1', 'postgres'])
if (!allowedHosts.has(host)) {
    throw new Error(`Refusing to migrate non-local test database host: ${host}`)
}

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'
execFileSync(npx, ['prisma', 'migrate', 'deploy'], { stdio: 'inherit' })
