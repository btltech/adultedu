
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const promptSnippet = "Sarah is planning to redecorate"

    console.log('🔍 Finding problematic question...')
    const question = await prisma.question.findFirst({
        where: { prompt: { contains: promptSnippet } }
    })

    if (!question) {
        console.log('❌ Question not found!')
        return
    }

    console.log(`✓ Found question ID: ${question.id}`)

    // Correct Math:
    // Paint: 3 * 28 = 84
    // Primer: 2 * 15 = 30
    // Brushes: 45
    // Expected = 159
    // Actual = 159 + 15 = 174
    // Remaining = 450 - 174 = 276

    const correctOptions = ["£246", "£261", "£276", "£291"]
    // £276 is index 2

    const correctExplanation = `
1. Calculate expected cost of paint: 3 liters × £28/liter = £84
2. Calculate expected cost of primer: 2 liters × £15/liter = £30
3. Add cost of brushes/rollers: £45
4. Total expected cost = £84 + £30 + £45 = £159
5. Actual spending was £15 higher: £159 + £15 = £174
6. Remaining budget: £450 - £174 = £276
    `.trim()

    await prisma.question.update({
        where: { id: question.id },
        data: {
            options: JSON.stringify(correctOptions),
            answer: "£276", // Matches correctOptions[2]
            explanation: correctExplanation,
            // Just in case checking the options array specifically by index on frontend
        }
    })

    console.log('✅ Question updated with correct math (Answer: £276)')
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
