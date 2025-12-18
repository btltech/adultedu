import { PrismaClient } from '@prisma/client'
import config from '../config/env.js'

let prisma

if (config.isDev) {
    if (!global.prisma) {
        global.prisma = new PrismaClient()
    }
    prisma = global.prisma
} else {
    prisma = new PrismaClient()
}

export default prisma
