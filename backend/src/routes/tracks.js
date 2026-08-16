import { Router } from 'express'
import prisma from '../lib/db.js'
import {
    attachPublishedQuestionCounts,
    getPublishedQuestionCountMap,
} from '../lib/publishedQuestionCounts.js'

const router = Router()

const PRACTICE_MINUTES_PER_QUESTION = 1.5

const LEARNING_GOAL_CONFIG = {
    workplace: {
        key: 'work-readiness',
        label: 'Work readiness',
    },
    qual_prep: {
        key: 'exam-prep',
        label: 'Exam preparation',
    },
    tech: {
        key: 'career-skills',
        label: 'Career and digital skills',
    },
    he: {
        key: 'academic-progression',
        label: 'Academic progression',
    },
}

function getLearningGoal(category) {
    return LEARNING_GOAL_CONFIG[category] || {
        key: 'structured-learning',
        label: 'Structured learning',
    }
}

function getStudyTimeBand(expectedStudyMinutes) {
    if (!Number.isFinite(expectedStudyMinutes) || expectedStudyMinutes <= 0) {
        return 'tbd'
    }

    if (expectedStudyMinutes <= 120) return 'short'
    if (expectedStudyMinutes <= 360) return 'medium'
    return 'long'
}

function getPublishedQuestionCount(topic) {
    return topic.publishedQuestionCount ?? topic._count?.questions ?? 0
}

function summarizeTrackLessonTime(topics) {
    const lessonCount = topics.reduce((count, topic) => count + topic.lessons.length, 0)
    const questionCount = topics.reduce((count, topic) => count + getPublishedQuestionCount(topic), 0)
    const estimatedMinutes = topics.reduce(
        (total, topic) => total + topic.lessons.reduce((topicTotal, lesson) => topicTotal + (lesson.estMinutes || 0), 0),
        0,
    )
    const practiceMinutes = questionCount > 0 ? Math.round(questionCount * PRACTICE_MINUTES_PER_QUESTION) : 0
    const expectedStudyMinutes = estimatedMinutes + practiceMinutes

    return {
        lessonCount,
        questionCount,
        estimatedMinutes,
        estimatedHours: estimatedMinutes > 0 ? Number((estimatedMinutes / 60).toFixed(1)) : null,
        practiceMinutes,
        expectedStudyMinutes: expectedStudyMinutes > 0 ? expectedStudyMinutes : null,
        expectedStudyHours: expectedStudyMinutes > 0 ? Number((expectedStudyMinutes / 60).toFixed(1)) : null,
        expectedStudyBand: getStudyTimeBand(expectedStudyMinutes),
    }
}

function formatTrack(track) {
    const lessonSummary = summarizeTrackLessonTime(track.topics)
    const learningGoal = getLearningGoal(track.category)
    const frameworks = track.trackFrameworks.map((tf) => ({
        slug: tf.framework.slug,
        title: tf.framework.title,
    }))

    return {
        id: track.id,
        slug: track.slug,
        title: track.title,
        description: track.description,
        category: track.category,
        isLive: track.isLive,
        framework: frameworks[0]?.slug || null,
        frameworks,
        learningGoal,
        topics: track.topics.map(({ id, title }) => ({ id, title })),
        topicsCount: track.topics.length,
        lessonCount: lessonSummary.lessonCount,
        questionCount: lessonSummary.questionCount,
        estimatedMinutes: lessonSummary.estimatedMinutes,
        estimatedHours: lessonSummary.estimatedHours,
        practiceMinutes: lessonSummary.practiceMinutes,
        expectedStudyMinutes: lessonSummary.expectedStudyMinutes,
        expectedStudyHours: lessonSummary.expectedStudyHours,
        expectedStudyBand: lessonSummary.expectedStudyBand,
    }
}

function matchesTrackFilters(track, filters) {
    const query = filters.query.trim().toLowerCase()
    const frameworks = track.frameworks.map((framework) => framework.slug.toLowerCase())
    const frameworkTitles = track.frameworks.map((framework) => framework.title.toLowerCase())
    const topicTitles = track.topics.map((topic) => topic.title.toLowerCase())
    const haystack = [
        track.title,
        track.description || '',
        track.learningGoal.label,
        ...frameworks,
        ...frameworkTitles,
        ...topicTitles,
    ].join(' ').toLowerCase()

    if (query && !haystack.includes(query)) {
        return false
    }

    if (filters.category && track.category !== filters.category) {
        return false
    }

    if (filters.framework && !frameworks.includes(filters.framework.toLowerCase())) {
        return false
    }

    if (filters.goal && track.learningGoal.key !== filters.goal) {
        return false
    }

    if (filters.studyTime && track.expectedStudyBand !== filters.studyTime) {
        return false
    }

    return true
}


/**
 * GET /api/tracks
 * List all tracks with their frameworks
 */
router.get('/tracks', async (req, res, next) => {
    try {
        const filters = {
            query: String(req.query.q || '').trim(),
            category: String(req.query.category || '').trim(),
            framework: String(req.query.framework || '').trim(),
            goal: String(req.query.goal || '').trim(),
            studyTime: String(req.query.studyTime || '').trim(),
        }

        const tracks = await prisma.track.findMany({
            include: {
                trackFrameworks: {
                    include: {
                        framework: true,
                    },
                },
                topics: {
                    select: {
                        id: true,
                        title: true,
                        lessons: {
                            where: { isPublished: true },
                            select: { estMinutes: true },
                        },
                    },
                    orderBy: { sortOrder: 'asc' }
                },
            },
            orderBy: [
                { isLive: 'desc' },
                { createdAt: 'asc' },
            ],
        })

        const topicIds = tracks.flatMap((track) => track.topics.map((topic) => topic.id))
        const questionCountMap = await getPublishedQuestionCountMap(topicIds)
        const tracksWithCounts = tracks.map((track) => ({
            ...track,
            topics: attachPublishedQuestionCounts(track.topics, questionCountMap),
        }))

        const formattedTracks = tracksWithCounts.map(formatTrack).filter((track) => matchesTrackFilters(track, filters))

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
                    },
                    orderBy: { sortOrder: 'asc' },
                },
            },
        })

        if (!track) {
            return res.status(404).json({ error: 'Track not found' })
        }

        const questionCountMap = await getPublishedQuestionCountMap(track.topics.map((topic) => topic.id))
        const topicsWithCounts = attachPublishedQuestionCounts(track.topics, questionCountMap)
        const hydratedTrack = {
            ...track,
            topics: topicsWithCounts,
        }

        const lessonSummary = summarizeTrackLessonTime(hydratedTrack.topics)
        const learningGoal = getLearningGoal(hydratedTrack.category)

        const formatted = {
            id: hydratedTrack.id,
            slug: hydratedTrack.slug,
            title: hydratedTrack.title,
            description: hydratedTrack.description,
            category: hydratedTrack.category,
            isLive: hydratedTrack.isLive,
            learningGoal,
            lessonCount: lessonSummary.lessonCount,
            questionCount: lessonSummary.questionCount,
            estimatedMinutes: lessonSummary.estimatedMinutes,
            estimatedHours: lessonSummary.estimatedHours,
            practiceMinutes: lessonSummary.practiceMinutes,
            expectedStudyMinutes: lessonSummary.expectedStudyMinutes,
            expectedStudyHours: lessonSummary.expectedStudyHours,
            expectedStudyBand: lessonSummary.expectedStudyBand,
            frameworks: hydratedTrack.trackFrameworks.map(tf => ({
                slug: tf.framework.slug,
                title: tf.framework.title,
            })),
            topics: hydratedTrack.topics.map(topic => ({
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
                questionCount: topic.publishedQuestionCount,
            })),
        }

        res.json(formatted)
    } catch (error) {
        next(error)
    }
})

export default router
