
import express from 'express'
import prisma from '../lib/db.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { validate, questionCreateSchema, questionUpdateSchema } from '../middleware/validate.js'

const router = express.Router()


// Protect all admin routes
router.use(requireAuth)
router.use(requireAdmin)

// ==========================================
// Dashboard Stats
// ==========================================
router.get('/stats', async (req, res, next) => {
    try {
        const [
            userCount,
            questionCount,
            trackCount,
            completedLessons,
            activeSessions
        ] = await Promise.all([
            prisma.user.count(),
            prisma.question.count(),
            prisma.track.count({ where: { isLive: true } }),
            prisma.enrollment.count(), // Rough proxy for activity
            prisma.session.count({
                where: { expiresAt: { gt: new Date() } }
            })
        ])

        res.json({
            users: userCount,
            questions: questionCount,
            liveTracks: trackCount,
            enrollments: completedLessons,
            activeSessions
        })
    } catch (error) {
        next(error)
    }
})

// ==========================================
// User Management
// ==========================================
router.get('/users', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 20
        const skip = (page - 1) * limit
        const search = req.query.search || ''

        const where = search ? {
            email: { contains: search }
        } : {}

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    _count: {
                        select: { enrollments: true }
                    }
                }
            }),
            prisma.user.count({ where })
        ])

        res.json({
            users,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        next(error)
    }
})

// ==========================================
// Content Management (Questions)
// ==========================================
router.get('/questions', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 20
        const skip = (page - 1) * limit
        const search = req.query.search || ''
        const type = req.query.type || '' // 'mcq', 'true_false'
        const status = req.query.status || '' // 'published', 'draft'
        const topicId = req.query.topicId || ''
        const trackId = req.query.trackId || ''

        const where = {
            AND: [
                search ? { prompt: { contains: search } } : {},
                type ? { type: type } : {},
                status === 'published' ? { isPublished: true } :
                    status === 'draft' ? { isPublished: false } : {},
                topicId ? { topicId: topicId } : {},
                trackId ? { topic: { trackId: trackId } } : {}
            ]
        }

        const [questions, total] = await Promise.all([
            prisma.question.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    topic: {
                        select: {
                            title: true,
                            track: { select: { title: true } }
                        }
                    },
                    ukLevel: { select: { code: true } }
                }
            }),
            prisma.question.count({ where })
        ])

        res.json({
            questions,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        next(error)
    }
})

// Get Single Question
router.get('/questions/:id', async (req, res, next) => {
    try {
        const { id } = req.params
        const question = await prisma.question.findUnique({
            where: { id },
            include: {
                topic: {
                    include: {
                        track: true,
                        topicOutcomes: {
                            include: {
                                outcome: true
                            }
                        }
                    }
                },
                ukLevel: true
            }
        })

        if (!question) {
            return res.status(404).json({ error: 'Question not found' })
        }

        res.json(question)
    } catch (error) {
        next(error)
    }
})

// Create Question
router.post('/questions', validate(questionCreateSchema), async (req, res, next) => {
    try {
        const {
            topicId,
            ukLevelId,
            type,
            prompt,
            options,
            answer,
            explanation,
            difficulty,
            tags,
            imageUrl,
            assets,
            isPublished,
            sourceMeta
        } = req.body

        const question = await prisma.question.create({
            data: {
                topicId,
                ukLevelId,
                type: type || 'mcq',
                prompt,
                options: options ? JSON.stringify(options) : null,
                answer: JSON.stringify(answer),
                explanation,
                difficulty: parseInt(difficulty) || 3,
                tags: tags ? JSON.stringify(tags) : null,
                imageUrl: imageUrl || null,
                assets: assets ? JSON.stringify(assets) : null,
                isPublished: !!isPublished,
                sourceMeta: sourceMeta ? JSON.stringify(sourceMeta) : null
            },
            include: {
                topic: true,
                ukLevel: true
            }
        })

        res.status(201).json(question)
    } catch (error) {
        next(error)
    }
})

// Update Question
router.put('/questions/:id', validate(questionUpdateSchema), async (req, res, next) => {
    try {
        const { id } = req.params
        const {
            topicId,
            ukLevelId,
            type,
            prompt,
            options,
            answer,
            explanation,
            difficulty,
            tags,
            imageUrl,
            assets,
            isPublished,
            sourceMeta
        } = req.body

        const question = await prisma.question.update({
            where: { id },
            data: (() => {
                const updateData = {
                    version: { increment: 1 }
                }

                if (topicId !== undefined) updateData.topicId = topicId
                if (ukLevelId !== undefined) updateData.ukLevelId = ukLevelId
                if (type !== undefined) updateData.type = type
                if (prompt !== undefined) updateData.prompt = prompt
                if (explanation !== undefined) updateData.explanation = explanation

                if (options !== undefined) {
                    updateData.options = options === null ? null : JSON.stringify(options)
                }

                if (answer !== undefined) {
                    updateData.answer = JSON.stringify(answer)
                }

                if (difficulty !== undefined) {
                    const parsed = parseInt(difficulty)
                    updateData.difficulty = Number.isNaN(parsed) ? undefined : parsed
                }

                if (tags !== undefined) {
                    updateData.tags = tags === null ? null : JSON.stringify(tags)
                }

                if (imageUrl !== undefined) {
                    updateData.imageUrl = imageUrl ? imageUrl : null
                }

                if (assets !== undefined) {
                    updateData.assets = assets === null ? null : JSON.stringify(assets)
                }

                if (isPublished !== undefined) {
                    updateData.isPublished = !!isPublished
                }

                if (sourceMeta !== undefined) {
                    updateData.sourceMeta = sourceMeta === null ? null : JSON.stringify(sourceMeta)
                }

                return updateData
            })(),
            include: {
                topic: true,
                ukLevel: true
            }
        })

        res.json(question)
    } catch (error) {
        console.error(error)
        next(error)
    }
})

router.delete('/questions/:id', async (req, res, next) => {
    try {
        const { id } = req.params
        await prisma.question.delete({ where: { id } })
        res.status(204).send()
    } catch (error) {
        next(error)
    }
})

// ==========================================
// Bulk Operations
// ==========================================

// Bulk Import Questions (JSON)
router.post('/bulk/import', async (req, res, next) => {
    try {
        const { questions } = req.body

        if (!Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ error: 'questions array is required' })
        }

        if (questions.length > 500) {
            return res.status(400).json({ error: 'Maximum 500 questions per import' })
        }

        const results = {
            imported: 0,
            failed: 0,
            errors: []
        }

        for (const q of questions) {
            try {
                await prisma.question.create({
                    data: {
                        topicId: q.topicId,
                        ukLevelId: q.ukLevelId,
                        type: q.type || 'mcq',
                        prompt: q.prompt,
                        options: q.options ? JSON.stringify(q.options) : null,
                        answer: JSON.stringify(q.answer),
                        explanation: q.explanation || null,
                        difficulty: parseInt(q.difficulty) || 3,
                        tags: q.tags ? JSON.stringify(q.tags) : null,
                        isPublished: !!q.isPublished
                    }
                })
                results.imported++
            } catch (err) {
                results.failed++
                results.errors.push({
                    prompt: q.prompt?.substring(0, 50),
                    error: err.message
                })
            }
        }

        res.json(results)
    } catch (error) {
        next(error)
    }
})

// Bulk Export Questions (JSON)
router.get('/bulk/export', async (req, res, next) => {
    try {
        const { topicId, trackId, isPublished } = req.query

        const where = {
            AND: [
                topicId ? { topicId } : {},
                trackId ? { topic: { trackId } } : {},
                isPublished !== undefined ? { isPublished: isPublished === 'true' } : {}
            ]
        }

        const questions = await prisma.question.findMany({
            where,
            include: {
                topic: { select: { id: true, title: true } },
                ukLevel: { select: { code: true, title: true } }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Format for export
        const exportData = questions.map(q => ({
            id: q.id,
            topicId: q.topicId,
            topicTitle: q.topic?.title,
            ukLevelId: q.ukLevelId,
            ukLevelCode: q.ukLevel?.code,
            type: q.type,
            prompt: q.prompt,
            options: q.options,
            answer: q.answer,
            explanation: q.explanation,
            difficulty: q.difficulty,
            tags: q.tags,
            isPublished: q.isPublished
        }))

        res.json({
            count: exportData.length,
            questions: exportData
        })
    } catch (error) {
        next(error)
    }
})

// Bulk Update Questions
router.put('/bulk/update', async (req, res, next) => {
    try {
        const { ids, updates } = req.body

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'ids array is required' })
        }

        if (ids.length > 100) {
            return res.status(400).json({ error: 'Maximum 100 questions per bulk update' })
        }

        const allowedFields = ['topicId', 'ukLevelId', 'difficulty', 'isPublished', 'tags']
        const updateData = {}

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                if (field === 'tags') {
                    updateData.tags = JSON.stringify(updates.tags)
                } else if (field === 'isPublished') {
                    updateData.isPublished = !!updates.isPublished
                } else {
                    updateData[field] = updates[field]
                }
            }
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No valid update fields provided' })
        }

        const result = await prisma.question.updateMany({
            where: { id: { in: ids } },
            data: {
                ...updateData,
                version: { increment: 1 }
            }
        })

        res.json({ updated: result.count })
    } catch (error) {
        next(error)
    }
})

// Bulk Delete Questions
router.delete('/bulk/delete', async (req, res, next) => {
    try {
        const { ids } = req.body

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'ids array is required' })
        }

        if (ids.length > 100) {
            return res.status(400).json({ error: 'Maximum 100 questions per bulk delete' })
        }

        const result = await prisma.question.deleteMany({
            where: { id: { in: ids } }
        })

        res.json({ deleted: result.count })
    } catch (error) {
        next(error)
    }
})

export default router
