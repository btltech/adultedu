#!/usr/bin/env node
/* Report question bank counts from bundled SQLite dev.db using the generated sqlite Prisma client */
import { PrismaClient as SqliteClient } from '../generated/sqlite-client/index.js'

const sqlite = new SqliteClient()

async function main() {
    // Totals
    const total = await sqlite.question.count()

    // By type (table name is `questions` in the DB)
    const byType = await sqlite.$queryRawUnsafe(`SELECT type, COUNT(*) as cnt FROM questions GROUP BY type ORDER BY cnt DESC`)

    // By uk level code (join uk_levels table)
    const byUk = await sqlite.$queryRawUnsafe(`SELECT u.code, COUNT(q.id) as cnt FROM questions q JOIN uk_levels u ON q.uk_level_id = u.id GROUP BY u.code ORDER BY cnt DESC`)

    // By published status
    const byPublished = await sqlite.$queryRawUnsafe(`SELECT is_published, COUNT(*) as cnt FROM questions GROUP BY is_published`)

    // Difficulty distribution
    const byDiff = await sqlite.$queryRawUnsafe(`SELECT difficulty, COUNT(*) as cnt FROM questions GROUP BY difficulty ORDER BY difficulty`)

    console.log('\nQuestion bank counts (SQLite dev.db)')
    console.log('-----------------------------------')
    console.log(`Total questions: ${total}\n`)

    console.log('By type:')
    for (const r of byType) console.log(`- ${r.type}: ${r.cnt}`)
    console.log('')

    console.log('By UK level:')
    for (const r of byUk) console.log(`- ${r.code}: ${r.cnt}`)
    console.log('')

    console.log('By published:')
    for (const r of byPublished) console.log(`- is_published=${r.is_published}: ${r.cnt}`)
    console.log('')

    console.log('Difficulty distribution (1-5):')
    for (const r of byDiff) console.log(`- difficulty ${r.difficulty}: ${r.cnt}`)
    console.log('')
}

main()
    .catch((e) => {
        console.error(e)
        process.exitCode = 1
    })
    .finally(async () => {
        await sqlite.$disconnect()
    })
