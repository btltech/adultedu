/**
 * Fix questions with missing or malformed options
 * 
 * Usage: node scripts/fix-broken-questions.js
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixBrokenQuestions() {
    console.log('\n🔍 Scanning for broken questions...\n')

    const allQuestions = await prisma.question.findMany({
        include: {
            topic: {
                include: { track: true }
            }
        }
    })

    let emptyOptions = []
    let malformedOptions = []
    let noAnswer = []
    let fixed = 0
    let deleted = 0

    for (const q of allQuestions) {
        let options = null
        let hasIssue = false
        let issue = ''

        // Parse options if it's a string
        if (typeof q.options === 'string') {
            try {
                options = JSON.parse(q.options)
            } catch (e) {
                options = null
                hasIssue = true
                issue = 'malformed JSON'
            }
        } else {
            options = q.options
        }

        // Check for empty/null options
        if (!options || (Array.isArray(options) && options.length === 0)) {
            hasIssue = true
            issue = 'empty or null options'
            emptyOptions.push({
                id: q.id,
                prompt: q.prompt.substring(0, 50) + '...',
                track: q.topic?.track?.title || 'Unknown',
                topic: q.topic?.title || 'Unknown'
            })
        }

        // Check if options is an array
        if (options && !Array.isArray(options)) {
            hasIssue = true
            issue = 'options is not an array'
            malformedOptions.push({
                id: q.id,
                prompt: q.prompt.substring(0, 50) + '...',
                optionsType: typeof options
            })
        }

        // Check for missing answer
        if (!q.answer || q.answer.trim() === '') {
            noAnswer.push({
                id: q.id,
                prompt: q.prompt.substring(0, 50) + '...',
                track: q.topic?.track?.title || 'Unknown'
            })
        }

        // For MCQ without options, we should delete as we can't fix
        if ((q.type === 'mcq' || q.type === 'true_false') && hasIssue) {
            // Delete the broken question
            await prisma.question.delete({ where: { id: q.id } })
            deleted++
        }
    }

    console.log('📊 Scan Results:')
    console.log(`   Total questions scanned: ${allQuestions.length}`)
    console.log(`   Questions with empty options: ${emptyOptions.length}`)
    console.log(`   Questions with malformed options: ${malformedOptions.length}`)
    console.log(`   Questions with no answer: ${noAnswer.length}`)
    console.log(`   Questions deleted: ${deleted}`)

    if (emptyOptions.length > 0) {
        console.log('\n📋 Empty options by track:')
        const byTrack = {}
        for (const q of emptyOptions) {
            byTrack[q.track] = (byTrack[q.track] || 0) + 1
        }
        for (const [track, count] of Object.entries(byTrack)) {
            console.log(`   ${track}: ${count} questions`)
        }
    }

    if (noAnswer.length > 0 && noAnswer.length <= 20) {
        console.log('\n⚠ Questions with no answer (first 20):')
        for (const q of noAnswer.slice(0, 20)) {
            console.log(`   - [${q.track}] ${q.prompt}`)
        }
    }

    // Get final count
    const finalCount = await prisma.question.count()
    console.log(`\n✅ Final question count: ${finalCount}`)
}

async function main() {
    try {
        await fixBrokenQuestions()
    } catch (error) {
        console.error('\n❌ Error:', error.message)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
