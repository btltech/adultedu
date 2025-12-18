/**
 * Validate content against DfE L2+ standards
 * Checks difficulty levels and structural integrity
 * 
 * Usage: node scripts/validate-standards.js
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function validateStandards() {
    console.log('\n📊 Validating content standards (DfE Level 2+)...\n')

    const questions = await prisma.question.findMany({
        include: {
            topic: {
                select: {
                    title: true,
                    track: { select: { title: true, slug: true } }
                }
            }
        }
    })

    const stats = {
        total: questions.length,
        level1: 0, // Below standard
        level2: 0, // Target (GCSE/L2)
        level3: 0, // Above target (A-Level/L3)
        unknown: 0,
        shortOptions: 0, // < 4 options (bad for MCQ)
    }

    const byTrack = {}

    for (const q of questions) {
        const trackTitle = q.topic?.track?.title || 'Unknown'
        if (!byTrack[trackTitle]) {
            byTrack[trackTitle] = { total: 0, belowStandard: 0 }
        }
        byTrack[trackTitle].total++

        // Check difficulty
        if (q.difficulty === 1) stats.level1++
        else if (q.difficulty === 2) stats.level2++
        else if (q.difficulty >= 3) stats.level3++
        else stats.unknown++

        if (q.difficulty < 2) {
            byTrack[trackTitle].belowStandard++
        }

        // Check options
        try {
            const opts = JSON.parse(q.options || '[]')
            if (Array.isArray(opts) && opts.length < 4 && q.type === 'mcq') {
                stats.shortOptions++
            }
        } catch (e) {
            // ignore
        }
    }

    console.log('📈 Global Difficulty Distribution:')
    console.log(`   Level 1 (Foundation/Below L2): ${stats.level1}`)
    console.log(`   Level 2 (GCSE/Standard):       ${stats.level2}`)
    console.log(`   Level 3+ (Advanced):           ${stats.level3}`)
    console.log(`   Unknown:                       ${stats.unknown}`)

    if (stats.shortOptions > 0) {
        console.log(`   ⚠ Questions with < 4 options:  ${stats.shortOptions}`)
    }

    console.log('\n🏫 Compliance by Course:')
    console.log('   (Target: 0 questions below standard)')

    for (const [title, data] of Object.entries(byTrack)) {
        const status = data.belowStandard === 0 ? '✅ Pass' : `⚠ ${data.belowStandard} below standard`
        console.log(`   - ${title.padEnd(30)}: ${status} (${data.total} total)`)
    }

    const passRate = ((stats.total - stats.level1) / stats.total * 100).toFixed(1)
    console.log(`\n✅ Overall Standard Compliance: ${passRate}%`)
}

async function main() {
    try {
        await validateStandards()
    } catch (error) {
        console.error('\n❌ Error:', error.message)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
