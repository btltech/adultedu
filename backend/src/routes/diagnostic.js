import { Router } from 'express'
import prisma from '../lib/db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

/**
 * GET /api/diagnostic/:trackSlug/start
 * Start a diagnostic assessment for a track
 */
router.get('/diagnostic/:trackSlug/start', requireAuth, async (req, res, next) => {
    try {
        const { trackSlug } = req.params
        const questionsPerLevel = 3 // Questions to ask per UK level

        // Find the track
        const track = await prisma.track.findUnique({
            where: { slug: trackSlug },
            include: {
                topics: {
                    include: {
                        ukLevel: true,
                        questions: {
                            where: {
                                isPublished: true,
                                type: { in: ['mcq', 'true_false', 'scenario'] },
                                options: { not: null },
                            },
                            take: questionsPerLevel * 2, // Get extra to randomize
                            select: {
                                id: true,
                                prompt: true,
                                options: true,
                                type: true,
                                difficulty: true,
                                ukLevelId: true,
                            }
                        }
                    }
                }
            }
        })

        if (!track) {
            return res.status(404).json({ error: 'Track not found' })
        }

        // Group questions by UK level
        const questionsByLevel = {}
        for (const topic of track.topics) {
            const levelCode = topic.ukLevel?.code || 'L1'
            if (!questionsByLevel[levelCode]) {
                questionsByLevel[levelCode] = []
            }
            questionsByLevel[levelCode].push(...topic.questions)
        }

        // Select questions for diagnostic (adaptive selection)
        // Start with Entry Level, then progress based on correct answers
        const diagnosticQuestions = []
        const levels = ['E1', 'E2', 'E3', 'L1', 'L2', 'L3']

        for (const level of levels) {
            const levelQuestions = questionsByLevel[level] || []
            // Shuffle and take questionsPerLevel
            const shuffled = levelQuestions.sort(() => Math.random() - 0.5)
            const selected = shuffled.slice(0, questionsPerLevel)

            for (const q of selected) {
                let options = []
                try {
                    options = JSON.parse(q.options || '[]')
                } catch { options = [] }

                diagnosticQuestions.push({
                    id: q.id,
                    prompt: q.prompt,
                    options,
                    type: q.type,
                    level,
                })
            }
        }

        // Limit to max 15 questions
        const finalQuestions = diagnosticQuestions.slice(0, 15)

        res.json({
            track: {
                id: track.id,
                slug: track.slug,
                title: track.title,
            },
            questions: finalQuestions,
            totalQuestions: finalQuestions.length,
        })
    } catch (error) {
        next(error)
    }
})

/**
 * POST /api/diagnostic/:trackSlug/submit
 * Submit diagnostic answers and get recommended level
 */
router.post('/diagnostic/:trackSlug/submit', requireAuth, async (req, res, next) => {
    try {
        const { trackSlug } = req.params
        const { answers } = req.body // Array of { questionId, answer }

        if (!answers || !Array.isArray(answers)) {
            return res.status(400).json({ error: 'answers array is required' })
        }

        const track = await prisma.track.findUnique({
            where: { slug: trackSlug }
        })

        if (!track) {
            return res.status(404).json({ error: 'Track not found' })
        }

        // Fetch questions and check answers
        const questionIds = answers.map(a => a.questionId)
        const questions = await prisma.question.findMany({
            where: { id: { in: questionIds } },
            include: { ukLevel: true }
        })

        const questionsMap = {}
        for (const q of questions) {
            questionsMap[q.id] = q
        }

        // Calculate score per level
        const levelScores = {}
        const levelCounts = {}

        for (const ans of answers) {
            const question = questionsMap[ans.questionId]
            if (!question) continue

            const levelCode = question.ukLevel?.code || 'L1'

            if (!levelScores[levelCode]) {
                levelScores[levelCode] = 0
                levelCounts[levelCode] = 0
            }

            levelCounts[levelCode]++

            // Check if answer is correct
            let correctAnswer
            try {
                correctAnswer = JSON.parse(question.answer)
            } catch {
                correctAnswer = question.answer
            }

            let options = []
            try {
                options = JSON.parse(question.options || '[]')
            } catch { options = [] }

            // Resolve index to value if needed (prefer literal option match first)
            if (Array.isArray(options) && options.length > 0) {
                if (typeof correctAnswer === 'number' && Number.isInteger(correctAnswer) && options[correctAnswer]) {
                    correctAnswer = options[correctAnswer]
                } else if (typeof correctAnswer === 'string') {
                    const trimmed = correctAnswer.trim()
                    const literalMatch = options.find((o) => String(o).trim() === trimmed)
                    if (literalMatch !== undefined) {
                        correctAnswer = literalMatch
                    } else if (/^\d+$/.test(trimmed)) {
                        const idx = parseInt(trimmed, 10)
                        if (idx >= 0 && idx < options.length && options[idx] !== undefined) {
                            correctAnswer = options[idx]
                        }
                    }
                }
            }

            const isCorrect = String(ans.answer).toLowerCase().trim() ===
                String(correctAnswer).toLowerCase().trim()

            if (isCorrect) {
                levelScores[levelCode]++
            }

            // Record attempt
            await prisma.attempt.create({
                data: {
                    userId: req.user.id,
                    questionId: question.id,
                    isCorrect,
                    userAnswer: JSON.stringify(ans.answer),
                }
            })
        }

        // Determine highest level with >= 70% score
        const levels = ['E1', 'E2', 'E3', 'L1', 'L2', 'L3']
        let recommendedLevel = 'E1'

        for (const level of levels) {
            const score = levelScores[level] || 0
            const count = levelCounts[level] || 0
            const percentage = count > 0 ? (score / count) * 100 : 0

            if (percentage >= 70) {
                recommendedLevel = level
            } else {
                break // Stop at first level below threshold
            }
        }

        // Get the ukLevel record
        const ukLevel = await prisma.ukLevel.findUnique({
            where: { code: recommendedLevel }
        })

        // Create or update enrollment with recommended level
        await prisma.enrollment.upsert({
            where: {
                userId_trackId: {
                    userId: req.user.id,
                    trackId: track.id,
                }
            },
            update: {
                currentUkLevelId: ukLevel?.id,
            },
            create: {
                userId: req.user.id,
                trackId: track.id,
                currentUkLevelId: ukLevel?.id,
            }
        })

        // Calculate overall stats
        const totalCorrect = Object.values(levelScores).reduce((a, b) => a + b, 0)
        const totalQuestions = Object.values(levelCounts).reduce((a, b) => a + b, 0)
        const overallPercentage = totalQuestions > 0
            ? Math.round((totalCorrect / totalQuestions) * 100)
            : 0

        res.json({
            recommendedLevel,
            levelTitle: ukLevel?.title || recommendedLevel,
            overallScore: {
                correct: totalCorrect,
                total: totalQuestions,
                percentage: overallPercentage,
            },
            levelBreakdown: levels.map(level => ({
                level,
                correct: levelScores[level] || 0,
                total: levelCounts[level] || 0,
                percentage: levelCounts[level]
                    ? Math.round(((levelScores[level] || 0) / levelCounts[level]) * 100)
                    : 0,
            })).filter(l => l.total > 0),
            message: `Based on your results, we recommend starting at ${recommendedLevel} (${ukLevel?.title || recommendedLevel})`
        })
    } catch (error) {
        next(error)
    }
})

export default router
