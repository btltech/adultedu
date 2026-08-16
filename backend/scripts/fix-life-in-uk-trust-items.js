/**
 * Targeted repair for Life in the UK content trust audit findings.
 *
 * Dry run by default. Add --apply to update the database.
 *
 * Usage:
 *   node scripts/fix-life-in-uk-trust-items.js
 *   node scripts/fix-life-in-uk-trust-items.js --apply
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const FIXES = [
    {
        id: '0cf6bbdc-f080-43eb-a2b6-f621a904feb8',
        expectedPromptIncludes: 'public authorities act lawfully and fairly',
        data: {
            prompt: 'Which body helps protect and promote equality and human rights in Great Britain?',
            options: JSON.stringify([
                'The Equality and Human Rights Commission',
                'The Office of the Public Guardian',
                'The Independent Monitoring Board',
                'The Crown Prosecution Service',
            ]),
            answer: '0',
            explanation: 'The Equality and Human Rights Commission promotes and enforces equality and human rights law in Great Britain. Courts, ombudsman schemes, and other public bodies deal with different kinds of legal disputes and complaints.',
        },
    },
    {
        id: 'eb3a9c83-39b9-4aa1-9f7e-e39dad97401f',
        expectedPromptIncludes: "today's Britain",
        data: {
            prompt: 'Which statement best describes everyday interaction in many public spaces in Britain?',
            options: JSON.stringify([
                'People mostly stay within their own cultural groups',
                'There is little interaction between different communities',
                'People from many backgrounds commonly mix and interact in public spaces',
                'Only certain areas allow integration between different groups',
            ]),
            answer: '2',
            explanation: 'People from different ethnic, religious, and cultural backgrounds commonly share workplaces, schools, services, and community spaces. Equality law and civic values support respectful participation in public life.',
        },
    },
]

function parseArgs(argv) {
    return new Set(argv.slice(2))
}

async function main() {
    const args = parseArgs(process.argv)
    const apply = args.has('--apply')

    console.log(`Mode: ${apply ? 'apply' : 'dry-run'}`)

    for (const fix of FIXES) {
        const question = await prisma.question.findUnique({
            where: { id: fix.id },
            select: { id: true, prompt: true },
        })

        if (!question) {
            console.log(`skip ${fix.id}: not found`)
            continue
        }

        if (!question.prompt.includes(fix.expectedPromptIncludes)) {
            console.log(`skip ${fix.id}: prompt guard did not match`)
            continue
        }

        if (!apply) {
            console.log(`would update ${fix.id}: ${fix.data.prompt}`)
            continue
        }

        await prisma.question.update({
            where: { id: fix.id },
            data: fix.data,
        })

        console.log(`updated ${fix.id}: ${fix.data.prompt}`)
    }
}

main()
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })