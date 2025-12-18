import { Router } from 'express'
import prisma from '../lib/db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()


/**
 * GET /api/progress
 * Get current user's enrollments and progress
 */
router.get('/progress', requireAuth, async (req, res, next) => {
    try {
        const enrollments = await prisma.enrollment.findMany({
            where: { userId: req.user.id },
            include: {
                track: {
                    include: {
                        topics: {
                            select: {
                                id: true,
                                _count: { select: { questions: { where: { isPublished: true } } } }
                            },
                            orderBy: { sortOrder: 'asc' }
                        },
                    },
                },
                currentUkLevel: true,
            },
            orderBy: { updatedAt: 'desc' },
        })

        // Get correct attempts with topic + track context so we can attribute progress correctly
        const correctAttempts = await prisma.attempt.findMany({
            where: {
                userId: req.user.id,
                isCorrect: true,
            },
            select: {
                questionId: true,
                question: {
                    select: {
                        topicId: true,
                        topic: {
                            select: { trackId: true }
                        }
                    }
                }
            },
            distinct: ['questionId'] // Only count each question once
        })

        // Map of trackId -> topicId -> correct question count
        const trackTopicCorrectMap = new Map()
        for (const attempt of correctAttempts) {
            const topicId = attempt.question?.topicId
            const trackId = attempt.question?.topic?.trackId
            if (!topicId || !trackId) continue

            if (!trackTopicCorrectMap.has(trackId)) {
                trackTopicCorrectMap.set(trackId, new Map())
            }
            const topicMap = trackTopicCorrectMap.get(trackId)
            topicMap.set(topicId, (topicMap.get(topicId) || 0) + 1)
        }

        const formatted = enrollments.map(e => ({
            id: e.id,
            trackId: e.track.id,
            trackSlug: e.track.slug,
            trackTitle: e.track.title,
            currentLevel: e.currentUkLevel?.code || 'Not set',
            totalTopics: e.track.topics.length,
            completedTopics: e.track.topics.reduce((count, topic) => {
                const correctCount = trackTopicCorrectMap.get(e.track.id)?.get(topic.id) || 0
                const totalQuestions = topic._count.questions || 0
                if (totalQuestions === 0) return count

                const percentage = Math.round((correctCount / totalQuestions) * 100)
                return percentage >= 80 ? count + 1 : count
            }, 0),
        }))

        res.json({ enrollments: formatted })
    } catch (error) {
        next(error)
    }
})

/**
 * GET /api/progress/:slug
 * Get detailed progress for a specific track
 */
router.get('/progress/:slug', requireAuth, async (req, res, next) => {
    try {
        const { slug } = req.params

        // 1. Get Track details with Topics and Question Counts
        const track = await prisma.track.findUnique({
            where: { slug },
            include: {
                topics: {
                    include: {
                        _count: {
                            select: { questions: { where: { isPublished: true } } }
                        }
                    },
                    orderBy: { sortOrder: 'asc' }
                }
            }
        })

        if (!track) return res.status(404).json({ error: 'Track not found' })

        // 2. Get User's Enrollment (Access Check)
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_trackId: {
                    userId: req.user.id,
                    trackId: track.id
                }
            }
        })

        if (!enrollment && req.user.role !== 'admin') {
            // Optional: Auto-enroll or return 403? 
            // For now, let's assume they might be viewing preview, but usually need enrollment.
            // Let's return 403 if not enrolled.
            return res.status(403).json({ error: 'Not enrolled in this track' })
        }

        // 3. Get Correct Attempts for this Track's Questions
        // efficient way: Find attempts where question.topic.trackId = track.id
        // But Prisma relations might be deep.
        // Alternative: Find all question IDs in this track first?
        // Or filter attempts by joining.

        // Let's fetch all correct attempts for the user, then filter in memory or map.
        // Better: Group by questionId where question is in the topics.

        const topicIds = track.topics.map(t => t.id)

        const userCorrectAttempts = await prisma.attempt.findMany({
            where: {
                userId: req.user.id,
                isCorrect: true,
                question: {
                    topicId: { in: topicIds }
                }
            },
            select: {
                questionId: true,
                question: {
                    select: { topicId: true }
                }
            },
            distinct: ['questionId'] // Count each unique question once
        })

        // 4. Calculate Mastery per Topic
        const progressByTopic = track.topics.map(topic => {
            const totalQuestions = topic._count.questions
            const correctCount = userCorrectAttempts.filter(a => a.question.topicId === topic.id).length
            const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0

            return {
                id: topic.id,
                title: topic.title,
                totalQuestions,
                correctCount,
                percentage,
                isMastered: percentage >= 80 // Threshold can be config
            }
        })

        const totalTrackQuestions = track.topics.reduce((acc, t) => acc + t._count.questions, 0)
        const totalTrackCorrect = userCorrectAttempts.length
        const totalTrackPercentage = totalTrackQuestions > 0 ? Math.round((totalTrackCorrect / totalTrackQuestions) * 100) : 0
        const masteredTopicsCount = progressByTopic.filter(t => t.isMastered).length

        const completedAll = masteredTopicsCount === track.topics.length && track.topics.length > 0

        let certificate = null
        if (completedAll) {
            certificate = await prisma.certificate.findUnique({
                where: {
                    userId_trackId: {
                        userId: req.user.id,
                        trackId: track.id
                    }
                }
            })

            if (!certificate) {
                // Create a simple download URL; PDF is generated on demand at /api/certificates/:id.pdf
                certificate = await prisma.certificate.create({
                    data: {
                        userId: req.user.id,
                        trackId: track.id,
                        title: `${track.title} Mastery`,
                        description: `Completed all topics for ${track.title}`,
                        downloadUrl: '' // fill after we have ID
                    }
                })

                // Update with final download path
                certificate = await prisma.certificate.update({
                    where: { id: certificate.id },
                    data: {
                        downloadUrl: `/api/certificates/${certificate.id}.pdf`
                    }
                })
            }
        }

        res.json({
            track: {
                id: track.id,
                title: track.title,
                slug: track.slug
            },
            overall: {
                totalQuestions: totalTrackQuestions,
                correctCount: totalTrackCorrect,
                percentage: totalTrackPercentage,
                isMastered: totalTrackPercentage >= 80
            },
            topicsMastered: masteredTopicsCount,
            topics: progressByTopic,
            certificate: completedAll && certificate ? {
                awarded: true,
                awardedAt: certificate.awardedAt,
                title: certificate.title,
                description: certificate.description,
                trackSlug: track.slug,
                id: certificate.id,
                downloadPath: certificate.downloadUrl || `/api/certificates/${certificate.id}.pdf`
            } : null
        })

    } catch (error) {
        next(error)
    }
})

// Enroll endpoint (keep existing)
router.post('/enrollments', requireAuth, async (req, res, next) => {
    try {
        const { trackId, ukLevelId } = req.body

        if (!trackId) {
            return res.status(400).json({ error: 'trackId is required' })
        }

        // Check if already enrolled
        const existing = await prisma.enrollment.findUnique({
            where: {
                userId_trackId: {
                    userId: req.user.id,
                    trackId,
                },
            },
        })

        if (existing) {
            return res.status(409).json({ error: 'Already enrolled in this track' })
        }

        const enrollment = await prisma.enrollment.create({
            data: {
                userId: req.user.id,
                trackId,
                currentUkLevelId: ukLevelId || null,
            },
        })

        res.status(201).json({
            message: 'Enrolled successfully',
            enrollment: {
                id: enrollment.id,
                trackId: enrollment.trackId,
            },
        })
    } catch (error) {
        next(error)
    }
})

export default router
