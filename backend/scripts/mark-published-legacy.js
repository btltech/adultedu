/**
 * Aligns the governance label for questions that were already public before
 * the review workflow existed. This is deliberately dry-run by default.
 *
 * Usage:
 *   node scripts/mark-published-legacy.js
 *   node scripts/mark-published-legacy.js --apply
 *   node scripts/mark-published-legacy.js --restore --apply
 */
import prisma from '../src/lib/db.js'

const apply = process.argv.includes('--apply')
const restore = process.argv.includes('--restore')
const fromStatus = restore ? 'legacy' : 'in_review'
const toStatus = restore ? 'in_review' : 'legacy'

const pending = await prisma.question.count({
    where: { isPublished: true, reviewStatus: fromStatus },
})

if (!apply) {
    console.log(JSON.stringify({ fromStatus, toStatus, pending, applied: 0, dryRun: true }, null, 2))
    await prisma.$disconnect()
    process.exit(0)
}

const result = await prisma.question.updateMany({
    where: { isPublished: true, reviewStatus: fromStatus },
    data: { reviewStatus: toStatus },
})

console.log(JSON.stringify({ fromStatus, toStatus, pending, applied: result.count, dryRun: false }, null, 2))
await prisma.$disconnect()
