
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixIntegrity() {
    console.log('\n🔧 Starting Comprehensive Question Integrity Repair...\n')

    const questions = await prisma.question.findMany({
        where: {
            type: { in: ['mcq', 'multi_select'] }
        },
        include: {
            topic: {
                include: { track: true }
            }
        }
    })

    console.log(`Loaded ${questions.length} MCQ/Multi questions to analyze.\n`)

    let fixedCount = 0
    let fixedQuoteMismatch = 0
    let fixedWhitespace = 0
    let fixedJsonFormat = 0
    let skipped = 0

    for (const q of questions) {
        let needsUpdate = false
        let newAnswer = q.answer
        let newOptions = q.options

        // 1. Parse Options
        let options = null
        try {
            options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options
        } catch (e) {
            console.log(`[${q.id}] Malformed options JSON. Skipped.`)
            skipped++
            continue
        }

        if (!Array.isArray(options) || options.length < 2) {
            skipped++
            continue // Can't fix missing options easily
        }

        // 2. Parse Answer
        let answer = q.answer
        try {
            answer = JSON.parse(q.answer)
        } catch (e) {
            // keep raw if not JSON
        }

        // Ensure answer is string for MCQ
        if (typeof answer !== 'string') {
            answer = String(answer)
        }

        if (!answer || String(answer).trim() === '') {
            // Check for empty answer - DELETE
            await prisma.question.delete({ where: { id: q.id } })
            skipped++ // counting as skipped/deleted
            // console.log(`[${q.id}] Deleted (Empty Answer)`)
            continue
        }

        // 3. Check for matching option
        const answerMatched = options.some(o => String(o).trim() === String(answer).trim())

        if (!answerMatched) {
            // Attempt repairs
            const cleanAnswer = String(answer).trim()
            let fixed = false

            // Repair A: Numeric Index (e.g. "2" -> options[1])
            // LLMs often output 1-based index
            if (/^\d+$/.test(cleanAnswer)) {
                const idx = parseInt(cleanAnswer)
                // Assume 1-based index first
                if (idx > 0 && idx <= options.length) {
                    newAnswer = JSON.stringify(options[idx - 1])
                    needsUpdate = true
                    fixed = true
                    // console.log(`[${q.id}] Fixed numeric index: ${cleanAnswer} -> ${options[idx-1]}`)
                }
                // Fallback: 0-based index
                else if (idx === 0 && options.length > 0) {
                    newAnswer = JSON.stringify(options[0])
                    needsUpdate = true
                    fixed = true
                }
            }

            // Repair B: Strip surrounding quotes from Answer
            if (!fixed) {
                const stripped = cleanAnswer.replace(/^["']|["']$/g, '')
                if (options.some(o => String(o).trim() === stripped)) {
                    newAnswer = JSON.stringify(stripped)
                    needsUpdate = true
                    fixed = true
                    fixedQuoteMismatch++
                }
            }

            // Repair C: Strip surrounding quotes from Options (if options have extra quotes in them)
            if (!fixed) {
                // Check if options have quotes but answer doesn't
                const cleanOptMatch = options.find(o => String(o).replace(/^["']|["']$/g, '').trim() === cleanAnswer)

                if (cleanOptMatch) {
                    // Start trusting the answer, maybe update option? 
                    // No, usually best to stick to option text or update answer to match option text exactly.
                    newAnswer = JSON.stringify(cleanOptMatch)
                    needsUpdate = true
                    fixed = true
                    fixedQuoteMismatch++
                } else {
                    // Maybe BOTH have quotes that don't match exactly?
                    const strippedAns = cleanAnswer.replace(/^["']|["']$/g, '')
                    const strippedOptMatch = options.find(o => String(o).replace(/^["']|["']$/g, '').trim() === strippedAns)

                    if (strippedOptMatch) {
                        newAnswer = JSON.stringify(strippedOptMatch)
                        needsUpdate = true
                        fixed = true
                        fixedQuoteMismatch++
                    }
                }
            }

            // Repair D: Whitespace mismatch
            if (!fixed) {
                const whitespaceMatch = options.find(o => String(o).trim() === cleanAnswer.trim())
                if (whitespaceMatch) {
                    newAnswer = JSON.stringify(whitespaceMatch)
                    needsUpdate = true
                    fixed = true
                    fixedWhitespace++
                }
            }
        } else {
            // Answer valid, ensure standard JSON string format
            try {
                // If it's already matching, just ensure it's saved as proper JSON string if it was raw
                // But careful not to double-encode if already encoded
                if (q.answer !== JSON.stringify(answer) && q.answer !== answer) {
                    // q.answer raw might be 'Foo'
                    // answer is 'Foo'
                    // We want '"Foo"'
                    newAnswer = JSON.stringify(answer)
                    needsUpdate = true
                    fixedJsonFormat++
                }
            } catch (e) { }
        }

        if (needsUpdate) {
            await prisma.question.update({
                where: { id: q.id },
                data: { answer: newAnswer }
            })
            fixedCount++
            if (fixedCount % 100 === 0) process.stdout.write('.')
        }
    }

    console.log('\n\n✅ Repair Complete!')
    console.log(`   Total Fixed:         ${fixedCount}`)
    console.log(`   Fixed Quotes:        ${fixedQuoteMismatch}`)
    console.log(`   Fixed Whitespace:    ${fixedWhitespace}`)
    console.log(`   Fixed JSON Format:   ${fixedJsonFormat}`)
    console.log(`   Skipped (Unfixable): ${skipped}`)
}

fixIntegrity()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
