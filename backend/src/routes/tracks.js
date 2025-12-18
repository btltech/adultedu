import { Router } from 'express'
import prisma from '../lib/db.js'

const router = Router()


/**
 * GET /api/tracks
 * List all tracks with their frameworks
 */
router.get('/tracks', async (req, res, next) => {
    try {
        const tracks = await prisma.track.findMany({
            include: {
                trackFrameworks: {
                    include: {
                        framework: true,
                    },
                },
                topics: {
                    select: { id: true, title: true },
                    orderBy: { sortOrder: 'asc' }
                },
            },
            orderBy: [
                { isLive: 'desc' },
                { createdAt: 'asc' },
            ],
        })

        const formattedTracks = tracks.map(track => ({
            id: track.id,
            slug: track.slug,
            title: track.title,
            description: track.description,
            category: track.category,
            isLive: track.isLive,
            framework: track.trackFrameworks[0]?.framework.slug || null,
            frameworks: track.trackFrameworks.map(tf => tf.framework.slug),
            topics: track.topics, // Return full array of {id, title}
            topicsCount: track.topics.length,
            // Estimated hours (placeholder - will be calculated from lessons later)
            estimatedHours: track.topics.length * 4,
        }))

        res.json(formattedTracks)
    } catch (error) {
        next(error)
    }
})

/**
 * GET /api/tracks/:slug
 * Get a single track with topics
 */
router.get('/tracks/:slug', async (req, res, next) => {
    try {
        const track = await prisma.track.findUnique({
            where: { slug: req.params.slug },
            include: {
                trackFrameworks: {
                    include: {
                        framework: true,
                    },
                },
                topics: {
                    include: {
                        ukLevel: true,
                        topicOutcomes: {
                            include: {
                                outcome: true
                            }
                        },
                        lessons: {
                            where: { isPublished: true },
                            select: { id: true, title: true, estMinutes: true },
                        },
                        _count: {
                            select: { questions: { where: { isPublished: true } } },
                        },
                    },
                    orderBy: { sortOrder: 'asc' },
                },
            },
        })

        if (!track) {
            return res.status(404).json({ error: 'Track not found' })
        }

        const formatted = {
            id: track.id,
            slug: track.slug,
            title: track.title,
            description: track.description,
            category: track.category,
            isLive: track.isLive,
            frameworks: track.trackFrameworks.map(tf => ({
                slug: tf.framework.slug,
                title: tf.framework.title,
            })),
            topics: track.topics.map(topic => ({
                id: topic.id,
                title: topic.title,
                description: topic.description,
                ukLevel: {
                    code: topic.ukLevel.code,
                    title: topic.ukLevel.title,
                },
                outcomes: topic.topicOutcomes.map(to => ({
                    code: to.outcome.code,
                    description: to.outcome.description
                })),
                lessons: topic.lessons,
                questionCount: topic._count.questions,
            })),
        }

        res.json(formatted)
    } catch (error) {
        next(error)
    }
})

export default router
