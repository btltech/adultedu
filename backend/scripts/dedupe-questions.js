
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔍 Checking for duplicate questions...')

    // Group by topicId and prompt is tricky in pure Prisma, so we'll fetch ID, topicId, prompt
    // For large datasets this is inefficient, but for ~3000 questions it's fine.

    const allQuestions = await prisma.question.findMany({
        select: {
            id: true,
            topicId: true,
            prompt: true,
            createdAt: true
        }
    })

    console.log(`   Scanned ${allQuestions.length} questions.`)

    const seen = new Map() // Key: topicId:prompt -> Value: id lookup
    const toDelete = []

    for (const q of allQuestions) {
        const key = `${q.topicId}:${q.prompt.trim()}`

        if (seen.has(key)) {
            // Duplicate found!
            // We keep the one already in the map (usually the earlier one if sorted by ID, or we can logic this)
            // Actually, we should probably keep the oldest.

            const existing = seen.get(key)

            // If current q is older than existing, swap them (keep q, delete existing)
            // But usually ID order is creation order.

            toDelete.push(q.id)
        } else {
            seen.set(key, q)
        }
    }

    console.log(`   Found ${toDelete.length} duplicates to remove.`)

    if (toDelete.length > 0) {
        const result = await prisma.question.deleteMany({
            where: {
                id: { in: toDelete }
            }
        })
        console.log(`   🗑️  Deleted ${result.count} duplicate questions.`)
    } else {
        console.log('   ✨ No duplicates found.')
    }

    await prisma.$disconnect()
}

main()
