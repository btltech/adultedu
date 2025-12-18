
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkIntegrity() {
    console.log('\n🔍 Starting Comprehensive Question Integrity Check...\n')

    const questions = await prisma.question.findMany({
        include: {
            topic: {
                include: { track: true }
            }
        }
    })

    console.log(`Loaded ${questions.length} questions. Analyzing...\n`)

    const issues = []
    let validCount = 0

    for (const q of questions) {
        const qIssues = []

        // 1. Check Prompt
        if (!q.prompt || q.prompt.trim().length === 0) {
            qIssues.push('Empty prompt')
        }

        // 2. Check Explanation
        if (!q.explanation || q.explanation.trim().length === 0) {
            qIssues.push('Empty explanation')
        }

        // 3. Check JSON Fields (Options & Answer)
        let options = null
        let answer = null

        // Parse Options
        if (q.type === 'mcq' || q.type === 'multi_select') {
            try {
                options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options
                if (!Array.isArray(options)) {
                    qIssues.push('Options is not an array')
                } else if (options.length < 2) {
                    qIssues.push(`Too few options (${options.length})`)
                } else {
                    // Check for empty strings in options
                    if (options.some(o => !o || typeof o !== 'string' || o.trim() === '')) {
                        qIssues.push('Contains empty or invalid option(s)')
                    }
                }
            } catch (e) {
                qIssues.push('Malformed options JSON')
            }
        }

        // Parse Answer
        try {
            let parsedAnswer = q.answer
            try {
                parsedAnswer = JSON.parse(q.answer)
            } catch (e) {
                // Keep raw
            }
            answer = parsedAnswer

            if (!answer) {
                qIssues.push('Empty answer')
            }
        } catch (e) {
            qIssues.push('Error processing answer field')
        }

        // 4. Logic Consistency (Answer in Options)
        if ((q.type === 'mcq') && Array.isArray(options) && answer) {
            const answerStr = String(answer).trim()
            const found = options.some(opt => String(opt).trim() === answerStr)

            if (!found) {
                qIssues.push(`Answer "${answerStr}" not found in options: [${options.join(', ')}]`)
            }
        }

        // 5. Track/Topic association
        if (!q.topic) {
            qIssues.push('Orphaned question (no topic)')
        }

        if (qIssues.length > 0) {
            issues.push({
                id: q.id,
                prompt: q.prompt ? (q.prompt.length > 60 ? q.prompt.substring(0, 60) + '...' : q.prompt) : '[No Prompt]',
                type: q.type,
                track: q.topic?.track?.title || 'Unknown',
                topic: q.topic?.title || 'Unknown',
                issues: qIssues
            })
        } else {
            validCount++
        }
    }

    // Report
    if (issues.length === 0) {
        console.log('✅ ALL QUESTIONS PASSED INTEGRITY CHECKS!')
    } else {
        console.log(`❌ Found ${issues.length} questions with issues:\n`)

        // Group by Track
        const byTrack = {}
        issues.forEach(i => {
            const t = i.track
            if (!byTrack[t]) byTrack[t] = []
            byTrack[t].push(i)
        })

        for (const [track, trackIssues] of Object.entries(byTrack)) {
            console.log(`\n📂 Track: ${track} (${trackIssues.length} issues)`)
            console.log('='.repeat(80))

            trackIssues.forEach((item, idx) => {
                console.log(`${idx + 1}. [${item.type}] ${item.prompt}`)
                console.log(`   ID: ${item.id}`)
                console.log(`   Topic: ${item.topic}`)
                console.log(`   Issues:`)
                item.issues.forEach(issue => console.log(`     - ⚠️ ${issue}`))
            })
        }

        console.log('\n📈 Summary:')
        console.log(`   Total Questions: ${questions.length}`)
        console.log(`   Valid:           ${validCount}`)
        console.log(`   Invalid:         ${issues.length}`)
        console.log(`   Health:          ${Math.round((validCount / questions.length) * 100)}%`)
    }
}

checkIntegrity()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
