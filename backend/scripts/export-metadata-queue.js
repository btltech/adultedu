#!/usr/bin/env node

// Read-only production snapshot helper. Run inside the Railway backend
// container, where the private Postgres hostname is reachable. The output is
// safe to copy to the local proposal pipeline; it contains no user data.
const { default: prisma } = await import('/app/src/lib/db.js')

const rows = await prisma.question.findMany({
    where: {
        isPublished: true,
        OR: [{ sourceUrl: null }, { sourceTitle: null }, { curriculumObjective: null }],
    },
    orderBy: { createdAt: 'asc' },
    select: {
        id: true, type: true, prompt: true, options: true, answer: true,
        explanation: true, version: true, sourceUrl: true, sourceTitle: true,
        curriculumObjective: true,
        topic: {
            select: {
                id: true, title: true,
                track: { select: { slug: true, title: true } },
                topicOutcomes: { select: { outcome: { select: { code: true, title: true, description: true } } } },
            },
        },
    },
})

process.stdout.write(JSON.stringify({ generatedAt: new Date().toISOString(), questions: rows }))
await prisma.$disconnect()
