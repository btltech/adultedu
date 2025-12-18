
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🤖 Starting Automated Quality Analysis & Publishing...\n')

    // Count stats
    const total = await prisma.question.count()
    const published = await prisma.question.count({ where: { isPublished: true } })
    const drafts = await prisma.question.count({ where: { isPublished: false } })

    console.log(`\n📊 Current Status:`)
    console.log(`   Total Questions: ${total}`)
    console.log(`   Published (Live): ${published}`)
    console.log(`   Drafts (Hidden): ${drafts}`)
    console.log('------------------------------------------')

    // Fetch ALL questions for analysis
    const questions = await prisma.question.findMany({
        include: { topic: true }
    })

    console.log(`Analyzing ${questions.length} questions...`)

    let passCount = 0
    let failCount = 0
    const issues = []

    for (const q of questions) {
        let isValid = true
        let reason = ''

        // 1. Check Prompt
        if (!q.prompt || q.prompt.length < 5) {
            isValid = false
            reason = 'Prompt too short'
        }

        // 2. Check Options (for MCQ)
        if (isValid && q.type === 'mcq') {
            try {
                const opts = JSON.parse(q.options)
                if (!Array.isArray(opts) || opts.length < 2) {
                    isValid = false
                    reason = 'Fewer than 2 options'
                } else if (opts.some(o => !o || o.trim() === '')) {
                    isValid = false
                    reason = 'Empty option detected'
                }
            } catch (e) {
                isValid = false
                reason = 'Invalid options JSON'
            }
        }

        // 3. Check Answer
        if (isValid) {
            if (q.answer === null || q.answer === undefined || q.answer === '') {
                isValid = false
                reason = 'Missing answer'
            }
        }

        if (isValid) {
            passCount++
        } else {
            failCount++
            issues.push({ id: q.id, prompt: q.prompt, reason })
        }
    }

    console.log('\n==========================================')
    console.log(`📊 Content Quality Report`)
    console.log(`   ✅ Passed Checks: ${passCount}`)
    console.log(`   ⚠️ Potential Issues: ${failCount}`)
    console.log('==========================================\n')

    if (issues.length > 0) {
        console.log('Issues found:')
        issues.forEach(i => console.log(` - ${i.reason}: ${i.prompt} (${i.id})`))
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
