/**
 * Import the bundled legacy SQLite database (`prisma/dev.db`) into Postgres via Prisma.
 *
 * This is intended for one-time migration when moving from SQLite → Postgres.
 *
 * Steps:
 * 1) Generate the SQLite Prisma client:
 *    SQLITE_DATABASE_URL="file:./dev.db" npx prisma generate --schema prisma/schema.sqlite.prisma
 *
 * 2) Run this script (Postgres DATABASE_URL must be set in the environment/.env):
 *    SQLITE_DATABASE_URL="file:./dev.db" node scripts/import-sqlite-devdb.js
 */

import { PrismaClient as PostgresClient } from '@prisma/client'
import { PrismaClient as SqliteClient } from '../generated/sqlite-client/index.js'

const postgres = new PostgresClient()
const sqlite = new SqliteClient()

async function createManyInBatches(model, rows, batchSize = 1000) {
    let inserted = 0
    for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize)
        const result = await model.createMany({
            data: batch,
            skipDuplicates: true,
        })
        inserted += result.count
    }
    return inserted
}

async function main() {
    console.log('Importing SQLite dev.db → Postgres...\n')

    const [
        ukLevels,
        frameworks,
        tracks,
        trackFrameworks,
        outcomes,
        topics,
        topicOutcomes,
        lessons,
        questions,
        assessments,
        assessmentQuestions,
    ] = await Promise.all([
        sqlite.ukLevel.findMany(),
        sqlite.framework.findMany(),
        sqlite.track.findMany(),
        sqlite.trackFramework.findMany(),
        sqlite.outcome.findMany(),
        sqlite.topic.findMany(),
        sqlite.topicOutcome.findMany(),
        sqlite.lesson.findMany(),
        sqlite.question.findMany(),
        sqlite.assessment.findMany(),
        sqlite.assessmentQuestion.findMany(),
    ])

    // SQLite can contain dangling FK references (foreign keys may not be enforced).
    // Filter/repair before inserting into Postgres where FK constraints are enforced.
    const ukLevelIds = new Set(ukLevels.map((r) => r.id))
    const frameworkIds = new Set(frameworks.map((r) => r.id))
    const trackIds = new Set(tracks.map((r) => r.id))

    const filteredTrackFrameworks = trackFrameworks.filter((r) => trackIds.has(r.trackId) && frameworkIds.has(r.frameworkId))
    const filteredOutcomes = outcomes.filter((r) => frameworkIds.has(r.frameworkId))

    const outcomeIds = new Set(filteredOutcomes.map((r) => r.id))
    const filteredTopics = topics.filter((r) => trackIds.has(r.trackId) && ukLevelIds.has(r.ukLevelId))
    const topicIds = new Set(filteredTopics.map((r) => r.id))

    const filteredTopicOutcomes = topicOutcomes.filter((r) => topicIds.has(r.topicId) && outcomeIds.has(r.outcomeId))
    const filteredLessons = lessons.filter((r) => topicIds.has(r.topicId))
    const lessonIds = new Set(filteredLessons.map((r) => r.id))

    const repairedQuestions = questions
        .filter((r) => topicIds.has(r.topicId) && ukLevelIds.has(r.ukLevelId))
        .map((r) => {
            if (r.lessonId && !lessonIds.has(r.lessonId)) return { ...r, lessonId: null }
            return r
        })

    const filteredAssessments = assessments.filter((r) => trackIds.has(r.trackId) && ukLevelIds.has(r.ukLevelId))
    const assessmentIds = new Set(filteredAssessments.map((r) => r.id))
    const questionIds = new Set(repairedQuestions.map((r) => r.id))

    const filteredAssessmentQuestions = assessmentQuestions.filter(
        (r) => assessmentIds.has(r.assessmentId) && questionIds.has(r.questionId)
    )

    console.log(`SQLite counts:`)
    console.log(`- ukLevels:            ${ukLevels.length}`)
    console.log(`- frameworks:          ${frameworks.length}`)
    console.log(`- tracks:              ${tracks.length}`)
    console.log(`- trackFrameworks:     ${trackFrameworks.length} (kept ${filteredTrackFrameworks.length})`)
    console.log(`- outcomes:            ${outcomes.length} (kept ${filteredOutcomes.length})`)
    console.log(`- topics:              ${topics.length} (kept ${filteredTopics.length})`)
    console.log(`- topicOutcomes:       ${topicOutcomes.length} (kept ${filteredTopicOutcomes.length})`)
    console.log(`- lessons:             ${lessons.length} (kept ${filteredLessons.length})`)
    console.log(`- questions:           ${questions.length} (kept ${repairedQuestions.length})`)
    console.log(`- assessments:         ${assessments.length} (kept ${filteredAssessments.length})`)
    console.log(`- assessmentQuestions: ${assessmentQuestions.length} (kept ${filteredAssessmentQuestions.length})\n`)

    // Insert in FK-safe order.
    const inserted = {}
    inserted.ukLevels = await createManyInBatches(postgres.ukLevel, ukLevels, 500)
    inserted.frameworks = await createManyInBatches(postgres.framework, frameworks, 200)
    inserted.tracks = await createManyInBatches(postgres.track, tracks, 200)
    inserted.trackFrameworks = await createManyInBatches(postgres.trackFramework, filteredTrackFrameworks, 1000)
    inserted.outcomes = await createManyInBatches(postgres.outcome, filteredOutcomes, 1000)
    inserted.topics = await createManyInBatches(postgres.topic, filteredTopics, 500)
    inserted.topicOutcomes = await createManyInBatches(postgres.topicOutcome, filteredTopicOutcomes, 1500)
    inserted.lessons = await createManyInBatches(postgres.lesson, filteredLessons, 500)
    inserted.questions = await createManyInBatches(postgres.question, repairedQuestions, 1000)
    inserted.assessments = await createManyInBatches(postgres.assessment, filteredAssessments, 500)
    inserted.assessmentQuestions = await createManyInBatches(postgres.assessmentQuestion, filteredAssessmentQuestions, 1500)

    console.log('\nInserted into Postgres (skipDuplicates on):')
    for (const [k, v] of Object.entries(inserted)) {
        console.log(`- ${k}: ${v}`)
    }

    const pgCounts = await Promise.all([
        postgres.ukLevel.count(),
        postgres.framework.count(),
        postgres.track.count(),
        postgres.topic.count(),
        postgres.lesson.count(),
        postgres.question.count(),
    ])

    console.log('\nPostgres totals:')
    console.log(`- ukLevels:   ${pgCounts[0]}`)
    console.log(`- frameworks: ${pgCounts[1]}`)
    console.log(`- tracks:     ${pgCounts[2]}`)
    console.log(`- topics:     ${pgCounts[3]}`)
    console.log(`- lessons:    ${pgCounts[4]}`)
    console.log(`- questions:  ${pgCounts[5]}`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await Promise.all([sqlite.$disconnect(), postgres.$disconnect()])
    })
