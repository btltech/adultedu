
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanEmpty() {
    console.log('🧹 cleaning empty questions...')

    // Fetch all to check JS logic vs DB logic
    const all = await prisma.question.findMany()
    let deleted = 0

    for (const q of all) {
        let isEmpty = false
        if (!q.answer) isEmpty = true
        else if (typeof q.answer === 'string' && q.answer.trim() === '') isEmpty = true
        else {
            try {
                const parsed = JSON.parse(q.answer)
                if (!parsed) isEmpty = true
                if (Array.isArray(parsed) && parsed.length === 0) isEmpty = true
                if (typeof parsed === 'string' && parsed.trim() === '') isEmpty = true
            } catch (e) { }
        }

        if (isEmpty) {
            await prisma.question.delete({ where: { id: q.id } })
            deleted++
        }
    }

    console.log(`Deleted ${deleted} questions with truly empty answers.`)
}

cleanEmpty().finally(() => prisma.$disconnect())
