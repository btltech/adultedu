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

    console.log(`SQLite counts:`)
    console.log(`- ukLevels:            ${ukLevels.length}`)
    console.log(`- frameworks:          ${frameworks.length}`)
    console.log(`- tracks:              ${tracks.length}`)
    console.log(`- trackFrameworks:     ${trackFrameworks.length}`)
    console.log(`- outcomes:            ${outcomes.length}`)
    console.log(`- topics:              ${topics.length}`)
    console.log(`- topicOutcomes:       ${topicOutcomes.length}`)
    console.log(`- lessons:             ${lessons.length}`)
    console.log(`- questions:           ${questions.length}`)
    console.log(`- assessments:         ${assessments.length}`)
    console.log(`- assessmentQuestions: ${assessmentQuestions.length}\n`)

    // Insert in FK-safe order.
    const inserted = {}
    inserted.ukLevels = await createManyInBatches(postgres.ukLevel, ukLevels, 500)
    inserted.frameworks = await createManyInBatches(postgres.framework, frameworks, 200)
    inserted.tracks = await createManyInBatches(postgres.track, tracks, 200)
    inserted.trackFrameworks = await createManyInBatches(postgres.trackFramework, trackFrameworks, 1000)
    inserted.outcomes = await createManyInBatches(postgres.outcome, outcomes, 1000)
    inserted.topics = await createManyInBatches(postgres.topic, topics, 500)
    inserted.topicOutcomes = await createManyInBatches(postgres.topicOutcome, topicOutcomes, 1500)
    inserted.lessons = await createManyInBatches(postgres.lesson, lessons, 500)
    inserted.questions = await createManyInBatches(postgres.question, questions, 1000)
    inserted.assessments = await createManyInBatches(postgres.assessment, assessments, 500)
    inserted.assessmentQuestions = await createManyInBatches(postgres.assessmentQuestion, assessmentQuestions, 1500)

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
