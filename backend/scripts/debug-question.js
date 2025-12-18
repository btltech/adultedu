
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debug() {
    const id = 'a804bc84-d4b9-4066-9908-2a84b0eab03a'
    const q = await prisma.question.findUnique({ where: { id } })

    console.log('RAW QUESTION DATA:')
    console.log('Type:', q.type)
    console.log('Prompt:', q.prompt)
    console.log('Options Raw:', q.options)
    console.log('Answer Raw:', q.answer)

    console.log('\n--- ANALYSIS ---')
    try {
        const parsedOpts = JSON.parse(q.options)
        console.log('Parsed Options:', parsedOpts)
        console.log('Option 2 Type:', typeof parsedOpts[2])
        console.log('Option 2 Value:', parsedOpts[2])
    } catch (e) { console.log('Options parse error', e) }

    try {
        const parsedAns = JSON.parse(q.answer)
        console.log('Parsed Answer:', parsedAns)
        console.log('Parsed Answer Type:', typeof parsedAns)
    } catch (e) { console.log('Answer parse error', e) }
}

debug().finally(() => prisma.$disconnect())
