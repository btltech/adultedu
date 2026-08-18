#!/usr/bin/env node
const { default: prisma } = await import('/app/src/lib/db.js')
const rows = await prisma.question.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'asc' },
    select: {
        id: true, type: true, prompt: true, options: true, answer: true, explanation: true,
        sourceUrl: true, sourceTitle: true, sourceCheckedAt: true, curriculumObjective: true,
        sourceMeta: true, reviewStatus: true, reviewedBy: true, reviewedAt: true,
        isPublished: true, version: true,
        topic: { select: { title: true, track: { select: { slug: true, title: true } } } },
    },
})
process.stdout.write(JSON.stringify({ generatedAt: new Date().toISOString(), questions: rows }))
await prisma.$disconnect()
