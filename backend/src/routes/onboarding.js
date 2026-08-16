import { Router } from 'express'
import prisma from '../lib/db.js'
import { requireAuth } from '../middleware/auth.js'
import {
    createOnboardingSummary,
    fetchLiveTracksForOnboarding,
    getGoalMeta,
    getLearnerProfile,
    normalizeConfidence,
    recommendTracks,
    recordOnboardingCompletion,
    recordProgressionOutcome,
    saveLearnerProfileSnapshot,
} from '../lib/learnerOnboarding.js'

const router = Router()

/**
 * POST /api/onboarding/recommend
 * Generate a recommended starting pathway from a short learner intake.
 */
router.post('/onboarding/recommend', async (req, res, next) => {
    try {
        const { primaryGoal, confidenceBefore, weeklyTime = 'steady' } = req.body
        const normalizedConfidence = normalizeConfidence(confidenceBefore)

        if (!primaryGoal) {
            return res.status(400).json({ error: 'primaryGoal is required' })
        }

        if (!normalizedConfidence) {
            return res.status(400).json({ error: 'confidenceBefore must be between 1 and 5' })
        }

        const liveTracks = await fetchLiveTracksForOnboarding(prisma)
        const rankedTracks = recommendTracks({
            tracks: liveTracks,
            primaryGoal,
            confidenceBefore: normalizedConfidence,
            weeklyTime,
        })

        const [recommendedPathway, ...alternatives] = rankedTracks

        if (!recommendedPathway) {
            return res.status(404).json({ error: 'No live pathways available right now' })
        }

        const summary = createOnboardingSummary({
            primaryGoal,
            confidenceBefore: normalizedConfidence,
            weeklyTime,
        })

        res.json({
            intake: summary,
            recommendedPathway,
            alternativePathways: alternatives.slice(0, 3),
            message: `AdultEdu recommends starting with ${recommendedPathway.title} based on your goal and confidence level.`,
            goal: getGoalMeta(primaryGoal),
        })
    } catch (error) {
        next(error)
    }
})

/**
 * POST /api/onboarding/complete
 * Save a learner's selected starting pathway and baseline.
 */
router.post('/onboarding/complete', requireAuth, async (req, res, next) => {
    try {
        const {
            primaryGoal,
            confidenceBefore,
            weeklyTime = 'steady',
            recommendedTrackSlug,
            selectedTrackSlug,
            referralSource,
            cohortTag,
            organizationTag,
            nextStepChoice,
        } = req.body

        const normalizedConfidence = normalizeConfidence(confidenceBefore)

        if (!primaryGoal || !selectedTrackSlug) {
            return res.status(400).json({ error: 'primaryGoal and selectedTrackSlug are required' })
        }

        if (!normalizedConfidence) {
            return res.status(400).json({ error: 'confidenceBefore must be between 1 and 5' })
        }

        const liveTracks = await fetchLiveTracksForOnboarding(prisma)
        const rankedTracks = recommendTracks({
            tracks: liveTracks,
            primaryGoal,
            confidenceBefore: normalizedConfidence,
            weeklyTime,
        })

        const recommendedTrack = rankedTracks.find((track) => track.slug === recommendedTrackSlug) || rankedTracks[0]
        const selectedTrack = rankedTracks.find((track) => track.slug === selectedTrackSlug)

        if (!selectedTrack) {
            return res.status(404).json({ error: 'Selected pathway could not be found' })
        }

        await prisma.enrollment.upsert({
            where: {
                userId_trackId: {
                    userId: req.user.id,
                    trackId: selectedTrack.id,
                },
            },
            update: {},
            create: {
                userId: req.user.id,
                trackId: selectedTrack.id,
            },
        })

        const intakeSummary = createOnboardingSummary({
            primaryGoal,
            confidenceBefore: normalizedConfidence,
            weeklyTime,
        })

        const onboarding = await saveLearnerProfileSnapshot(prisma, req.user.id, {
            ...intakeSummary,
            recommendedTrack,
            selectedTrack,
            referralSource: referralSource || null,
            cohortTag: cohortTag?.trim() || null,
            organizationTag: organizationTag?.trim() || null,
            nextStepChoice: nextStepChoice || 'open-pathway',
        }, 'onboarding-complete')

        await recordOnboardingCompletion(prisma, req.user.id, onboarding)

        res.status(201).json({
            message: 'Starting point saved',
            onboarding,
        })
    } catch (error) {
        next(error)
    }
})

/**
 * POST /api/onboarding/outcome
 * Capture confidence-after and next-step choice after a learner finishes a pathway.
 */
router.post('/onboarding/outcome', requireAuth, async (req, res, next) => {
    try {
        const { trackSlug, confidenceAfter, nextStepChoice } = req.body
        const normalizedConfidence = normalizeConfidence(confidenceAfter)

        if (!trackSlug || !nextStepChoice) {
            return res.status(400).json({ error: 'trackSlug and nextStepChoice are required' })
        }

        if (!normalizedConfidence) {
            return res.status(400).json({ error: 'confidenceAfter must be between 1 and 5' })
        }

        const track = await prisma.track.findUnique({
            where: { slug: trackSlug },
        })

        if (!track) {
            return res.status(404).json({ error: 'Track not found' })
        }

        const existingProfile = await getLearnerProfile(prisma, req.user.id)

        const onboarding = await saveLearnerProfileSnapshot(prisma, req.user.id, {
            completedTrack: {
                id: track.id,
                slug: track.slug,
                title: track.title,
                category: track.category,
                learningGoal: existingProfile?.selectedTrack?.learningGoal || null,
                expectedStudyMinutes: existingProfile?.selectedTrack?.expectedStudyMinutes || null,
                expectedStudyBand: existingProfile?.selectedTrack?.expectedStudyBand || 'tbd',
                questionCount: existingProfile?.selectedTrack?.questionCount || 0,
                framework: existingProfile?.selectedTrack?.framework || null,
            },
            confidenceAfter: normalizedConfidence,
            nextStepChoice,
            outcomeRecordedAt: new Date().toISOString(),
        }, 'progression-outcome')

        await recordProgressionOutcome(prisma, req.user.id, onboarding)

        res.status(201).json({
            message: 'Progression outcome saved',
            onboarding,
        })
    } catch (error) {
        next(error)
    }
})

/**
 * GET /api/onboarding/status
 * Return the current learner starting-point snapshot.
 */
router.get('/onboarding/status', requireAuth, async (req, res, next) => {
    try {
        const onboarding = await getLearnerProfile(prisma, req.user.id)

        res.json({
            onboarding,
            needsOnboarding: onboarding?.needsOnboarding ?? true,
        })
    } catch (error) {
        next(error)
    }
})

export default router