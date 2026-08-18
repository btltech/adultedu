#!/usr/bin/env node

/**
 * Apply an already reviewed metadata payload inside the Railway backend
 * container. The payload is supplied as METADATA_PAYLOAD_B64 so no report file
 * needs to be copied into the private container.
 */
const { default: prisma } = await import('/app/src/lib/db.js')
const payload = JSON.parse(Buffer.from(process.env.METADATA_PAYLOAD_B64 || '', 'base64').toString('utf8'))
let updated = 0
const skipped = []
for (const record of payload.records || []) {
    if (record.decision !== 'match' || record.approved !== true) continue
    const question = (payload.questions || []).find((candidate) => candidate.id === record.id)
    if (!question) {
        skipped.push({ id: record.id, reason: 'question snapshot missing' })
        continue
    }
    const result = await prisma.question.updateMany({
        where: { id: question.id, version: question.version, isPublished: true },
        data: {
            sourceUrl: record.source.url,
            sourceTitle: record.source.title,
            sourceCheckedAt: new Date(),
            curriculumObjective: record.objective.text,
            sourceMeta: JSON.stringify({
                metadataMethod: payload.model?.model ? 'batch-reviewed' : 'topic-objective-map',
                verification: payload.model?.model ? 'item-reviewed' : 'pending-item-review',
                objectiveCode: record.objective.code,
                sourceMap: payload.sourceMap,
                model: payload.model,
            }),
            reviewStatus: 'in_review',
            reviewedBy: 'metadata-batch-script',
            reviewedAt: new Date(),
            version: { increment: 1 },
        },
    })
    if (result.count === 1) updated += 1
    else skipped.push({ id: question.id, reason: 'version changed or no longer published' })
}
console.log(JSON.stringify({ updated, skipped }))
await prisma.$disconnect()
