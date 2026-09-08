import { Router } from 'express'
import prisma from '../lib/db.js'
import { hasPublishedTopicContent } from '../lib/curriculumVisibility.js'
import { optionalAuth } from '../middleware/auth.js'

const router = Router()


/**
 * GET /api/topics/:id
 * Get topic details with lessons and question count
 */
router.get('/topics/:id', optionalAuth, async (req, res, next) => {
    try {
        const topic = await prisma.topic.findUnique({
            where: { id: req.params.id },
            include: {
                ukLevel: true,
                track: {
                    select: { id: true, slug: true, title: true },
                },
                lessons: {
                    where: { isPublished: true },
                    orderBy: { sortOrder: 'asc' },
                    select: {
                        id: true,
                        title: true,
                        summary: true,
                        estMinutes: true,
                    },
                },
                _count: {
                    select: { questions: { where: { isPublished: true } } },
                },
            },
        })

        if (!topic) {
            return res.status(404).json({ error: 'Topic not found' })
        }

        if (req.user?.role !== 'admin' && !hasPublishedTopicContent({
            lessons: topic.lessons,
            publishedQuestionCount: topic._count.questions,
        })) {
            return res.status(404).json({ error: 'Topic not found' })
        }

        res.json({
            id: topic.id,
            title: topic.title,
            description: topic.description,
            ukLevel: topic.ukLevel.code,
            trackId: topic.track.id,
            trackSlug: topic.track.slug,
            trackTitle: topic.track.title,
            lessons: topic.lessons,
            questionCount: topic._count.questions,
        })
    } catch (error) {
        next(error)
    }
})

export default router
