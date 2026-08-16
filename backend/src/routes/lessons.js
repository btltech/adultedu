import { Router } from 'express'
import prisma from '../lib/db.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'
import { awardXP, XP_CORRECT_ANSWER } from './gamification.js'
import { parseSourceMeta, scoreQuestionAnswer } from '../lib/scoring.js'
import {
    attachPublishedQuestionCounts,
    getPublishedQuestionCountMap,
} from '../lib/publishedQuestionCounts.js'

const router = Router()

function clampInt(value, min, max, fallback) {
    const n = Number.parseInt(String(value), 10)
    if (!Number.isFinite(n)) return fallback
    return Math.min(max, Math.max(min, n))
}

function shuffleArray(items) {
    const copy = Array.isArray(items) ? [...items] : []
    for (let index = copy.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1))
        ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
    }
    return copy
}

function formatPracticeQuestion(question, fallbackUkLevel = null) {
    let options = null
    let meta = {}

    try {
        options = question.options ? JSON.parse(question.options) : null
    } catch {
        options = null
    }

    try {
        meta = question.sourceMeta ? JSON.parse(question.sourceMeta) : {}
    } catch {
        meta = {}
    }

    const levelCode = question.ukLevel?.code || fallbackUkLevel || 'L1'

    return {
        id: question.id,
        type: question.type,
        prompt: question.prompt,
        difficulty: question.difficulty,
        tags: question.tags,
        imageUrl: question.imageUrl,
        assets: question.assets,
        options,
        ukLevel: levelCode,
        hints: meta.hints || [],
        solutionSteps: meta.solutionSteps || [],
        topic: question.topic
            ? {
                id: question.topic.id,
                title: question.topic.title,
            }
            : null,
    }
}

function selectBalancedTrackQuestions({ questions, orderedTopicIds, limit }) {
    const questionPoolByTopicId = new Map(orderedTopicIds.map((topicId) => [topicId, []]))

    for (const question of questions) {
        if (!questionPoolByTopicId.has(question.topicId)) {
            questionPoolByTopicId.set(question.topicId, [])
        }
        questionPoolByTopicId.get(question.topicId).push(question)
    }

    const activeTopicIds = orderedTopicIds.filter((topicId) => (questionPoolByTopicId.get(topicId) || []).length > 0)
    if (activeTopicIds.length === 0) return []

    const selected = []
    const basePerTopic = Math.floor(limit / activeTopicIds.length)
    let remainder = limit % activeTopicIds.length

    for (const topicId of activeTopicIds) {
        const shuffledPool = shuffleArray(questionPoolByTopicId.get(topicId) || [])
        const takeCount = Math.min(shuffledPool.length, basePerTopic + (remainder > 0 ? 1 : 0))
        if (remainder > 0) remainder -= 1

        selected.push(...shuffledPool.slice(0, takeCount))
        questionPoolByTopicId.set(topicId, shuffledPool.slice(takeCount))
    }

    if (selected.length < limit) {
        const leftovers = shuffleArray(
            activeTopicIds.flatMap((topicId) => questionPoolByTopicId.get(topicId) || [])
        )
        selected.push(...leftovers.slice(0, limit - selected.length))
    }

    return shuffleArray(selected).slice(0, limit)
}

function computeTargetDifficulty(recentAttempts) {
    if (!Array.isArray(recentAttempts) || recentAttempts.length === 0) {
        return { targetDifficulty: 3, recentAccuracy: null, samples: 0 }
    }

    const samples = recentAttempts.length
    const correct = recentAttempts.filter((a) => !!a.isCorrect).length
    const recentAccuracy = samples > 0 ? correct / samples : 0

    const avgDifficulty = recentAttempts.reduce((sum, a) => sum + (Number(a.difficulty) || 3), 0) / samples

    // Conservative bump/drop (keeps users in a "flow" zone without swinging wildly)
    let targetDifficulty = Math.round(avgDifficulty)
    if (samples >= 5) {
        if (recentAccuracy >= 0.8) targetDifficulty = Math.min(5, targetDifficulty + 1)
        if (recentAccuracy <= 0.5) targetDifficulty = Math.max(1, targetDifficulty - 1)
    }

    return { targetDifficulty, recentAccuracy, samples }
}

async function getAdaptivePracticeBatch({ userId, topicId, limit }) {
    const questions = await prisma.question.findMany({
        where: {
            topicId,
            isPublished: true,
        },
        select: {
            id: true,
            type: true,
            prompt: true,
            options: true,
            difficulty: true,
            tags: true,
            imageUrl: true,
            assets: true,
            sourceMeta: true,
            createdAt: true,
            ukLevel: { select: { code: true } },
        },
        orderBy: { createdAt: 'desc' },
    })

    if (questions.length === 0) {
        return { questions: [], adaptive: { targetDifficulty: 3, recentAccuracy: null, samples: 0 } }
    }

    // Per-question performance summary for this user/topic.
    const perQuestion = await prisma.$queryRaw`
        SELECT
            a.question_id AS "questionId",
            COUNT(*)::int AS "attempts",
            SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END)::int AS "correct",
            MAX(a.created_at) AS "lastAttemptAt"
        FROM attempts a
        JOIN questions q ON q.id = a.question_id
        WHERE a.user_id = ${userId} AND q.topic_id = ${topicId}
        GROUP BY a.question_id;
    `

    const perfByQuestionId = new Map(
        (perQuestion || []).map((row) => [row.questionId, row])
    )

    // Recent attempts to estimate a difficulty "sweet spot".
    const recent = await prisma.$queryRaw`
        SELECT
            a.is_correct AS "isCorrect",
            q.difficulty AS "difficulty"
        FROM attempts a
        JOIN questions q ON q.id = a.question_id
        WHERE a.user_id = ${userId} AND q.topic_id = ${topicId}
        ORDER BY a.created_at DESC
        LIMIT 30;
    `

    const adaptive = computeTargetDifficulty(recent || [])
    const now = Date.now()

    const scored = questions.map((q) => {
        const perf = perfByQuestionId.get(q.id)
        const attempts = perf?.attempts ?? 0
        const correct = perf?.correct ?? 0
        const wrong = Math.max(0, attempts - correct)
        const lastAttemptAt = perf?.lastAttemptAt ? new Date(perf.lastAttemptAt).getTime() : null

        let score = 0

        // Primary goal: avoid repetition by strongly preferring unseen questions.
        if (attempts === 0) {
            score += 1000
        } else {
            // Second goal: resurface questions the learner is getting wrong.
            score += wrong * 120
            score -= correct * 15
        }

        // Third goal: avoid immediate repeats.
        if (lastAttemptAt) {
            const hoursAgo = (now - lastAttemptAt) / (1000 * 60 * 60)
            if (hoursAgo < 6) score -= 300
            else if (hoursAgo < 24) score -= 150
            else if (hoursAgo < 72) score -= 60
            else if (hoursAgo < 168) score -= 15
        }

        // Difficulty alignment to keep sessions in a "flow" zone.
        const diff = Math.abs((Number(q.difficulty) || 3) - adaptive.targetDifficulty)
        score -= diff * 10

        return { score, question: q }
    })

    scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        return new Date(b.question.createdAt).getTime() - new Date(a.question.createdAt).getTime()
    })

    return { questions: scored.slice(0, limit).map((x) => x.question), adaptive }
}



// REWRITE: Explicit practice route test
// GET practice questions for a topic
router.get('/practice/:topicId', requireAuth, async (req, res, next) => {
    try {
        const { topicId } = req.params
        const limit = clampInt(req.query.limit ?? 10, 1, 50, 10)
        const strategy = String(req.query.strategy || 'adaptive') // adaptive | latest

        const topic = await prisma.topic.findUnique({
            where: { id: topicId },
            include: { track: true, ukLevel: true },
        })

        if (!topic) {
            return res.status(404).json({ error: 'Topic not found' })
        }

        const selection = strategy === 'latest'
            ? {
                questions: await prisma.question.findMany({
                    where: { topicId, isPublished: true },
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        type: true,
                        prompt: true,
                        options: true,
                        difficulty: true,
                        tags: true,
                        imageUrl: true,
                        assets: true,
                        sourceMeta: true,
                        createdAt: true,
                        ukLevel: { select: { code: true } },
                    },
                }),
                adaptive: null,
            }
            : await getAdaptivePracticeBatch({ userId: req.user.id, topicId, limit })

        // Auto-enroll user if not already enrolled (unless admin)
        if (req.user.role !== 'admin') {
            const enrollment = await prisma.enrollment.findUnique({
                where: {
                    userId_trackId: {
                        userId: req.user.id,
                        trackId: topic.trackId
                    }
                }
            })
            if (!enrollment) {
                // Auto-enroll the user in this track
                await prisma.enrollment.create({
                    data: {
                        userId: req.user.id,
                        trackId: topic.trackId,
                    }
                })
            }
        }

        const formattedQuestions = selection.questions.map((questionRow) =>
            formatPracticeQuestion(questionRow, topic.ukLevel?.code)
        )

        res.json({
            topic: {
                id: topic.id,
                title: topic.title,
                ukLevel: topic.ukLevel?.code,
            },
            track: {
                slug: topic.track.slug,
                title: topic.track.title,
            },
            questions: formattedQuestions,
            total: formattedQuestions.length,
            ...(selection.adaptive
                ? {
                    adaptive: {
                        strategy,
                        targetDifficulty: selection.adaptive.targetDifficulty,
                        recentAccuracy: selection.adaptive.recentAccuracy,
                        samples: selection.adaptive.samples,
                    },
                }
                : { adaptive: { strategy } }),
        })
    } catch (error) {
        next(error)
    }
})

// GET public mock-test questions for a track
router.get('/public/practice/tracks/:trackSlug', async (req, res, next) => {
    try {
        const { trackSlug } = req.params
        const limit = clampInt(req.query.limit ?? 24, 5, 100, 24)

        const track = await prisma.track.findUnique({
            where: { slug: trackSlug },
            include: {
                topics: {
                    include: {
                        ukLevel: {
                            select: { code: true },
                        },
                    },
                    orderBy: { sortOrder: 'asc' },
                },
            },
        })

        if (!track || !track.isLive) {
            return res.status(404).json({ error: 'Track not found' })
        }

        const questionCountMap = await getPublishedQuestionCountMap(track.topics.map((topic) => topic.id))
        const topicsWithCounts = attachPublishedQuestionCounts(track.topics, questionCountMap)

        const liveTopics = topicsWithCounts.filter((topic) => topic.publishedQuestionCount > 0)
        if (liveTopics.length === 0) {
            return res.json({
                track: {
                    slug: track.slug,
                    title: track.title,
                    description: track.description,
                },
                questions: [],
                total: 0,
                passMark: Math.ceil(limit * 0.75),
                topics: topicsWithCounts.map((topic) => ({
                    id: topic.id,
                    title: topic.title,
                    ukLevel: topic.ukLevel?.code || null,
                    questionCount: topic.publishedQuestionCount,
                })),
            })
        }

        const orderedTopicIds = liveTopics.map((topic) => topic.id)
        const fallbackLevelByTopicId = new Map(liveTopics.map((topic) => [topic.id, topic.ukLevel?.code || null]))

        const publishedQuestions = await prisma.question.findMany({
            where: {
                topicId: { in: orderedTopicIds },
                isPublished: true,
            },
            select: {
                id: true,
                topicId: true,
                type: true,
                prompt: true,
                options: true,
                difficulty: true,
                tags: true,
                imageUrl: true,
                assets: true,
                sourceMeta: true,
                createdAt: true,
                ukLevel: { select: { code: true } },
                topic: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        const selectedQuestions = selectBalancedTrackQuestions({
            questions: publishedQuestions,
            orderedTopicIds,
            limit,
        })

        res.json({
            track: {
                slug: track.slug,
                title: track.title,
                description: track.description,
            },
            topics: topicsWithCounts.map((topic) => ({
                id: topic.id,
                title: topic.title,
                ukLevel: topic.ukLevel?.code || null,
                questionCount: topic.publishedQuestionCount,
            })),
            questions: selectedQuestions.map((questionRow) =>
                formatPracticeQuestion(questionRow, fallbackLevelByTopicId.get(questionRow.topicId))
            ),
            total: selectedQuestions.length,
            passMark: Math.ceil(limit * 0.75),
        })
    } catch (error) {
        next(error)
    }
})


/**
 * GET /api/lessons/:id
 * Get lesson content
 */
router.get('/lessons/:id', optionalAuth, async (req, res, next) => {
    try {
        const lesson = await prisma.lesson.findUnique({
            where: { id: req.params.id },
            include: {
                topic: {
                    include: {
                        track: {
                            select: { id: true, slug: true, title: true },
                        },
                        ukLevel: true,
                        lessons: {
                            where: { isPublished: true },
                            orderBy: { sortOrder: 'asc' },
                            select: {
                                id: true,
                                title: true,
                                estMinutes: true,
                            },
                        },
                    },
                },
            },
        })

        if (!lesson) {
            return res.status(404).json({ error: 'Lesson not found' })
        }

        if (!lesson.isPublished && (!req.user || req.user.role !== 'admin')) {
            return res.status(404).json({ error: 'Lesson not found' })
        }

        // Parse content blocks
        let contentBlocks = []
        try {
            contentBlocks = JSON.parse(lesson.contentBlocks || '[]')
        } catch (e) {
            contentBlocks = []
        }

        const currentLessonIndex = lesson.topic.lessons.findIndex((entry) => entry.id === lesson.id)
        const previousLesson = currentLessonIndex > 0 ? lesson.topic.lessons[currentLessonIndex - 1] : null
        const nextLesson = currentLessonIndex >= 0 && currentLessonIndex < lesson.topic.lessons.length - 1
            ? lesson.topic.lessons[currentLessonIndex + 1]
            : null

        res.json({
            id: lesson.id,
            title: lesson.title,
            summary: lesson.summary,
            contentBlocks,
            estMinutes: lesson.estMinutes,
            topic: {
                id: lesson.topic.id,
                title: lesson.topic.title,
                ukLevel: lesson.topic.ukLevel.code,
                lessons: lesson.topic.lessons,
                lessonPosition: currentLessonIndex >= 0 ? currentLessonIndex + 1 : null,
                lessonCount: lesson.topic.lessons.length,
                previousLesson,
                nextLesson,
            },
            track: {
                id: lesson.topic.track.id,
                slug: lesson.topic.track.slug,
                title: lesson.topic.track.title,
            },
        })
    } catch (error) {
        next(error)
    }
})



/**
 * POST /api/practice/submit
 * Submit an answer and get feedback
 */
router.post('/practice/submit', requireAuth, async (req, res, next) => {
    try {
        const { questionId, answer, timeSpentSec } = req.body

        if (!questionId || answer === undefined) {
            return res.status(400).json({ error: 'questionId and answer are required' })
        }

        const question = await prisma.question.findUnique({
            where: { id: questionId },
            include: {
                topic: {
                    select: {
                        trackId: true
                    }
                }
            }
        })

        if (!question) {
            return res.status(404).json({ error: 'Question not found' })
        }

        // Auto-enroll user if not already enrolled (unless admin)
        if (req.user.role !== 'admin') {
            const enrollment = await prisma.enrollment.findUnique({
                where: {
                    userId_trackId: {
                        userId: req.user.id,
                        trackId: question.topic.trackId
                    }
                }
            })
            if (!enrollment) {
                // Auto-enroll the user in this track
                await prisma.enrollment.create({
                    data: {
                        userId: req.user.id,
                        trackId: question.topic.trackId,
                    }
                })
            }
        }

        const scored = scoreQuestionAnswer({ question, userAnswer: answer })
        if (!scored.ok) {
            return res.status(500).json({ error: 'Question scoring failed', reason: scored.reason || 'unknown' })
        }

        const isCorrect = !!scored.isCorrect
        const correctAnswerForClient = scored.correctAnswer

        // Check if this is user's first attempt on this question
        let isFirstTry = true
        let xpResult = null

        // Record attempt if user is logged in
        if (req.user) {
            // Check for previous attempts
            const previousAttempts = await prisma.attempt.count({
                where: {
                    userId: req.user.id,
                    questionId,
                }
            })
            isFirstTry = previousAttempts === 0

            await prisma.attempt.create({
                data: {
                    userId: req.user.id,
                    questionId,
                    isCorrect,
                    userAnswer: JSON.stringify(answer),
                    timeSpentSec: timeSpentSec || null,
                },
            })

            // Award XP for correct answers
            if (isCorrect) {
                xpResult = await awardXP(req.user.id, XP_CORRECT_ANSWER, isFirstTry)
            } else {
                // Add incorrect answers to review queue for spaced repetition
                const reviewEligible = (() => {
                    const type = String(question.type || '')
                    if (['mcq', 'true_false', 'scenario'].includes(type)) return true
                    // Multi-step MCQ-style questions (no assets) can be reviewed as normal MCQ.
                    if (type === 'multi_step' && !question.assets && question.options) return true
                    return false
                })()

                const tomorrow = new Date()
                tomorrow.setDate(tomorrow.getDate() + 1)

                if (reviewEligible) {
                    await prisma.reviewItem.upsert({
                        where: {
                            userId_questionId: {
                                userId: req.user.id,
                                questionId,
                            }
                        },
                        update: {
                            // Reset if already exists
                            dueDate: tomorrow,
                            easeFactor: 2.5,
                            interval: 1,
                            repetitions: 0,
                        },
                        create: {
                            userId: req.user.id,
                            questionId,
                            dueDate: tomorrow,
                            easeFactor: 2.5,
                            interval: 1,
                            repetitions: 0,
                        }
                    })
                }
            }
        }

        const meta = parseSourceMeta(question.sourceMeta)

        res.json({
            isCorrect,
            correctAnswer: correctAnswerForClient,
            explanation: question.explanation,
            solutionSteps: meta.solutionSteps || [],
            xp: xpResult, // Include XP info if awarded
        })
    } catch (error) {
        next(error)
    }
})

// POST public mock-test answer and feedback
router.post('/public/practice/tracks/:trackSlug/submit', async (req, res, next) => {
    try {
        const { trackSlug } = req.params
        const { questionId, answer } = req.body

        if (!questionId || answer === undefined) {
            return res.status(400).json({ error: 'questionId and answer are required' })
        }

        const question = await prisma.question.findUnique({
            where: { id: questionId },
            include: {
                topic: {
                    include: {
                        track: {
                            select: { slug: true },
                        },
                    },
                },
            },
        })

        if (!question || question.topic?.track?.slug !== trackSlug || !question.isPublished) {
            return res.status(404).json({ error: 'Question not found' })
        }

        const scored = scoreQuestionAnswer({ question, userAnswer: answer })
        if (!scored.ok) {
            return res.status(500).json({ error: 'Question scoring failed', reason: scored.reason || 'unknown' })
        }

        const meta = parseSourceMeta(question.sourceMeta)

        res.json({
            isCorrect: !!scored.isCorrect,
            correctAnswer: scored.correctAnswer,
            explanation: question.explanation,
            solutionSteps: meta.solutionSteps || [],
        })
    } catch (error) {
        next(error)
    }
})

export default router
