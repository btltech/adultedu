import { PrismaClient } from '@prisma/client'
import { generateJSON } from '../src/lib/llm.js'

const prisma = new PrismaClient()

/**
 * Generate lessons for a topic
 */
async function generateLessons(track, topic) {
    console.log(`   📖 Generating lessons for: ${topic.title} (Level: ${topic.ukLevelId})`)

    const prompt = `Create 3-4 COMPREHENSIVE lessons for the topic "${topic.title}" in the Python Mastery course.
Topic description: ${topic.description}
Difficulty Level: ${topic.ukLevelId} (UK Level framework)

The content should be deep, technical, yet accessible. Use plenty of code examples.

Return a JSON array of lessons:
[
  {
    "title": "string",
    "summary": "2 sentences",
    "estMinutes": 15,
    "order": 1,
    "contentBlocks": [
      { "type": "heading", "content": "..." },
      { "type": "subheading", "content": "..." },
      { "type": "paragraph", "content": "..." },
      { "type": "list", "items": ["...", "..."] },
      { "type": "code", "content": "python code snippet" },
      { "type": "callout", "variant": "tip", "content": "..." }
    ]
  }
]

Each lesson should have 6-8 content blocks, including at least 2 code blocks and 1 callout.`

    try {
        const lessons = await generateJSON(prompt, 'You are an expert Python educator. Output a JSON array of lessons only.');
        console.log(`      ✓ Generated ${lessons.length} lessons`)
        return lessons
    } catch (err) {
        console.error(`      ❌ Failed to generate lessons for ${topic.title}:`, err.message);
        // Log a bit more for debugging
        if (err.content) console.log('Full content received (first 500 chars):', err.content.substring(0, 500));
        return [];
    }
}

/**
 * Generate questions for a topic
 */
async function generateQuestions(track, topic) {
    console.log(`   ❓ Generating questions for: ${topic.title}`)

    const prompt = `Create 10 practice questions for the topic "${topic.title}" in the Python Mastery course.
Topic description: ${topic.description}

Requirement:
- Mix of MCQ and True/False questions.
- Questions MUST test deep understanding, including code output prediction.
- Difficulty should match Level ${topic.ukLevelId}.

Return a JSON array of questions with:
- prompt: string (the question text)
- type: "mcq" or "true_false"
- options: array of 4 strings (for mcq) or ["True", "False"] (for true_false)
- correctAnswer: number (0-based index)
- explanation: string (detailed explanation of why)
- difficulty: number (1-5)`

    try {
        const questions = await generateJSON(prompt, 'You are an exam writer. Output a JSON array of questions only.');
        console.log(`      ✓ Generated ${questions.length} questions`)
        return questions
    } catch (err) {
        console.error(`      ❌ Failed to generate questions for ${topic.title}:`, err.message);
        return [];
    }
}



/**
 * Save generated content to database
 */
async function saveContent(track, topicRecord, lessons, questions) {
    console.log(`   💾 Saving content for topic: ${topicRecord.title}`)

    // Create lessons
    for (const lessonData of lessons) {
        await prisma.lesson.create({
            data: {
                title: lessonData.title,
                summary: lessonData.summary,
                estMinutes: lessonData.estMinutes || 15,
                sortOrder: lessonData.order,
                contentBlocks: JSON.stringify(lessonData.contentBlocks || []),
                topicId: topicRecord.id,
                isPublished: true
            }
        })
    }

    // Create questions
    for (const qData of questions) {
        const answer = Array.isArray(qData.options) && qData.correctAnswer !== undefined
            ? qData.options[qData.correctAnswer]
            : String(qData.correctAnswer || 0)

        await prisma.question.create({
            data: {
                prompt: qData.prompt,
                type: qData.type,
                options: JSON.stringify(qData.options || []),
                answer: answer,
                explanation: qData.explanation || '',
                difficulty: qData.difficulty || 3,
                isPublished: true,
                topicId: topicRecord.id,
                ukLevelId: topicRecord.ukLevelId,
            }
        })
    }
}

/**
 * Main function
 */
async function main() {
    console.log(`\n🚀 Starting Python Mastery Content Generation...`)

    const track = await prisma.track.findUnique({
        where: { slug: 'python-mastery' },
        include: { topics: { orderBy: { sortOrder: 'asc' } } }
    })

    if (!track) {
        console.error(`Track 'python-mastery' not found. Run seed first.`)
        process.exit(1)
    }

    console.log(`Track: ${track.title}`)
    console.log(`Topics found: ${track.topics.length}`)

    try {
        for (const topic of track.topics) {
            // Check if topic already has content
            const lessonCount = await prisma.lesson.count({ where: { topicId: topic.id } })
            if (lessonCount > 0) {
                console.log(`   ⏭ Skipping ${topic.title} (already has content)`)
                continue
            }

            console.log(`\n📚 Processing Topic: ${topic.title}`)

            // 1. Generate Lesson Titles/Summaries first
            const outlinePrompt = `Create an outline of 4 distinct lessons for the topic "${topic.title}" in a Python Mastery course.
Description: ${topic.description}

Return a JSON array of objects:
[
  { "title": "...", "summary": "...", "order": 1 }
]`
            const outline = await generateJSON(outlinePrompt, 'Output JSON array only.')

            for (const lessonMeta of outline) {
                console.log(`   📖 Generating Lesson: ${lessonMeta.title}`)
                const lessonPrompt = `Create a detailed educational lesson titled "${lessonMeta.title}".
Topic: ${topic.title} - ${topic.summary || topic.description}
Difficulty: ${topic.ukLevelId}

Return a JSON object with:
- contentBlocks: array of 8-12 content blocks (heading, subheading, paragraph, list, code, callout)
- estMinutes: number (10-15)

Example block: { "type": "code", "content": "print('hello')" }`

                try {
                    const lessonContent = await generateJSON(lessonPrompt, 'Output JSON object only.')
                    await prisma.lesson.create({
                        data: {
                            title: lessonMeta.title,
                            summary: lessonMeta.summary,
                            estMinutes: lessonContent.estMinutes || 15,
                            sortOrder: lessonMeta.order,
                            contentBlocks: JSON.stringify(lessonContent.contentBlocks || []),
                            topicId: topic.id,
                            isPublished: true
                        }
                    })
                    console.log(`      ✅ Saved lesson`)
                } catch (err) {
                    console.error(`      ❌ Failed lesson ${lessonMeta.title}:`, err.message)
                }
            }

            // 2. Generate Questions in batches of 5 to avoid truncation
            console.log(`   ❓ Generating questions for: ${topic.title}`)
            for (let i = 0; i < 2; i++) {
                const questionsPrompt = `Create 5 practice questions for "${topic.title}".
Level: ${topic.ukLevelId}
Include deep code prediction questions.

Return JSON array of 5 questions with: 
prompt, type (mcq/true_false), options, correctAnswer (index), explanation, difficulty(1-5)`

                try {
                    const questions = await generateJSON(questionsPrompt, 'Output JSON array of 5 items only.')
                    for (const qData of questions) {
                        const answer = Array.isArray(qData.options) && qData.correctAnswer !== undefined
                            ? qData.options[qData.correctAnswer]
                            : String(qData.correctAnswer || 0)

                        await prisma.question.create({
                            data: {
                                prompt: qData.prompt,
                                type: qData.type,
                                options: JSON.stringify(qData.options || []),
                                answer: answer,
                                explanation: qData.explanation || '',
                                difficulty: qData.difficulty || 3,
                                isPublished: true,
                                topicId: topic.id,
                                ukLevelId: topic.ukLevelId,
                            }
                        })
                    }
                    console.log(`      ✅ Saved 5 questions (batch ${i + 1})`)
                } catch (err) {
                    console.error(`      ❌ Failed batch ${i + 1}:`, err.message)
                }
            }
        }

        console.log(`\n✅ Python Mastery content generation complete!`)

    } catch (error) {
        console.error('\n❌ Error:', error.message)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
