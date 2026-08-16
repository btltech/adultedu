import prisma from '../src/lib/db.js'
import logger from '../src/lib/logger.js'
import { processDueReturnReminders } from '../src/lib/accountEmails.js'

try {
    const summary = await processDueReturnReminders(prisma)

    logger.info('Return reminder run completed', summary)

    if (summary.failed > 0) {
        process.exitCode = 1
    }
} catch (error) {
    logger.error('Return reminder run failed', { error: error.message, stack: error.stack })
    process.exitCode = 1
} finally {
    await prisma.$disconnect()
}