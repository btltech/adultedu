/**
 * Script to clear all attempt data from the database
 * Run this to reset progress for all users
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🧹 Clearing all attempt data...')

    const result = await prisma.attempt.deleteMany({})

    console.log(`✅ Deleted ${result.count} attempts`)
    console.log('📊 Progress has been reset for all users')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
