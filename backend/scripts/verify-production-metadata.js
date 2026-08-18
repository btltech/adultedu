#!/usr/bin/env node
const { default: prisma } = await import('/app/src/lib/db.js')
const [published, missingSource, missingObjective, inReview] = await Promise.all([
    prisma.question.count({ where: { isPublished: true } }),
    prisma.question.count({ where: { isPublished: true, OR: [{ sourceUrl: null }, { sourceTitle: null }] } }),
    prisma.question.count({ where: { isPublished: true, curriculumObjective: null } }),
    prisma.question.count({ where: { isPublished: true, reviewStatus: 'in_review' } }),
])
console.log(JSON.stringify({ published, missingSource, missingObjective, inReview }))
await prisma.$disconnect()
