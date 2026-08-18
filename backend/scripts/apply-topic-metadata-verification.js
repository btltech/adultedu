#!/usr/bin/env node
const { default: prisma } = await import('/app/src/lib/db.js')
const payload = JSON.parse(Buffer.from(process.env.METADATA_PAYLOAD_B64 || '', 'base64').toString('utf8'))
let updated = 0
const skipped = []
for (const record of payload.records || []) {
    if (!record.ok || record.reason !== 'topic_source_objective_consistent') continue
    const result = await prisma.question.updateMany({
        where: { id: record.id, version: record.version, isPublished: true },
        data: {
            sourceMeta: JSON.stringify({ metadataMethod: 'topic-objective-map', verification: 'topic-map-verified', objectiveCode: record.objectiveCode, sourceMap: payload.sourceMap || 'legacy-source-objective-plan-2026-08-17.json', factualEditorialReview: 'separate-content-audit' }),
            reviewStatus: 'in_review',
            reviewedBy: 'metadata-topic-map-verifier',
            reviewedAt: new Date(),
            version: { increment: 1 },
        },
    })
    if (result.count === 1) updated += 1
    else skipped.push({ id: record.id, reason: 'version changed or no longer published' })
}
console.log(JSON.stringify({ updated, skipped }))
await prisma.$disconnect()
