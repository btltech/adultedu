const PROFILE_SNAPSHOT_EVENT = 'learner_profile_snapshot'
const ONBOARDING_COMPLETED_EVENT = 'onboarding_completed'
const PROGRESSION_OUTCOME_EVENT = 'progression_outcome_recorded'

const GOAL_CONFIG = {
    'digital-confidence': {
        label: 'Digital Confidence',
        description: 'Build confidence with everyday online tasks and guided digital support.',
        keywords: ['digital', 'computer', 'internet', 'office', 'essential'],
        preferredCategories: ['workplace'],
        preferredFrameworks: ['EDS'],
        preferredSlugs: ['essential-digital-skills', 'microsoft-office-essentials', 'financial-literacy'],
    },
    'essential-digital-skills': {
        label: 'Essential Digital Skills',
        description: 'Strengthen everyday digital capability for life, work, and online services.',
        keywords: ['digital', 'essential', 'office', 'online'],
        preferredCategories: ['workplace'],
        preferredFrameworks: ['EDS', 'FS'],
        preferredSlugs: ['essential-digital-skills', 'microsoft-office-essentials', 'business-english'],
    },
    'life-in-the-uk': {
        label: 'Life in the UK',
        description: 'Prepare for citizenship, practical knowledge, and life in the UK.',
        keywords: ['life in the uk', 'citizenship', 'government', 'britain'],
        preferredCategories: ['qual_prep'],
        preferredFrameworks: ['LIFEUK'],
        preferredSlugs: ['life-in-the-uk-test'],
    },
    'employability-skills': {
        label: 'Employability Skills',
        description: 'Focus on practical work-readiness, communication, and digital confidence.',
        keywords: ['work', 'business', 'office', 'employability', 'digital'],
        preferredCategories: ['workplace'],
        preferredFrameworks: ['EDS', 'FS'],
        preferredSlugs: ['essential-digital-skills', 'business-english', 'microsoft-office-essentials'],
    },
    'tech-foundations': {
        label: 'Tech Foundations',
        description: 'Start with practical technical pathways and confidence-building coding foundations.',
        keywords: ['python', 'programming', 'tech', 'ai', 'code'],
        preferredCategories: ['tech'],
        preferredFrameworks: ['TECH'],
        preferredSlugs: ['python-foundations', 'intro-to-ai', 'ai-for-everyone', 'cpp-introduction'],
    },
    'qualification-prep': {
        label: 'Qualification Preparation',
        description: 'Work toward GCSE, Functional Skills, or A-Level progression.',
        keywords: ['gcse', 'functional skills', 'a-level', 'maths', 'english'],
        preferredCategories: ['qual_prep', 'qualifications'],
        preferredFrameworks: ['GCSE', 'FS', 'ALEVEL'],
        preferredSlugs: ['gcse-maths', 'functional-skills-english', 'functional-skills-maths', 'a-level-maths'],
    },
}

const WEEKLY_TIME_CONFIG = {
    light: {
        label: 'Light weekly time',
        description: 'Around 30 to 60 minutes each week.',
        preferredBands: ['short', 'medium'],
    },
    steady: {
        label: 'Steady weekly time',
        description: 'Around 1 to 3 hours each week.',
        preferredBands: ['medium', 'short', 'long'],
    },
    focused: {
        label: 'Focused weekly time',
        description: 'More than 3 hours each week.',
        preferredBands: ['long', 'medium'],
    },
}

const LEARNING_GOAL_LABELS = {
    workplace: 'Work readiness',
    qual_prep: 'Exam preparation',
    qualifications: 'Qualification preparation',
    tech: 'Career and digital skills',
    he: 'Academic progression',
}

function safeParseJson(value, fallback = null) {
    if (!value) return fallback

    try {
        return JSON.parse(value)
    } catch {
        return fallback
    }
}

export function normalizeConfidence(value) {
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) return null
    return Math.min(5, Math.max(1, Math.round(parsed)))
}

export function getGoalMeta(goalKey) {
    return GOAL_CONFIG[goalKey] || {
        label: 'Guided learning',
        description: 'Start with a structured pathway that matches your next step.',
        keywords: [],
        preferredCategories: [],
        preferredFrameworks: [],
        preferredSlugs: [],
    }
}

export function getWeeklyTimeMeta(weeklyTime) {
    return WEEKLY_TIME_CONFIG[weeklyTime] || WEEKLY_TIME_CONFIG.steady
}

export function getStartingPoint(confidenceBefore) {
    const normalized = normalizeConfidence(confidenceBefore)

    if (!normalized) {
        return {
            key: 'undisclosed',
            label: 'Starting point not set',
            description: 'Choose a confidence level so AdultEdu can recommend a calmer first step.',
        }
    }

    if (normalized <= 2) {
        return {
            key: 'needs-confidence-building',
            label: 'Needs confidence-building',
            description: 'Start with shorter, clearer pathways that build confidence before speed.',
        }
    }

    if (normalized === 3) {
        return {
            key: 'building-confidence',
            label: 'Building confidence',
            description: 'A practical, step-by-step pathway is likely to fit well now.',
        }
    }

    return {
        key: 'ready-to-stretch',
        label: 'Ready to stretch',
        description: 'You can begin with a fuller pathway and deeper practice where needed.',
    }
}

function getStudyTimeBand(expectedStudyMinutes) {
    if (!Number.isFinite(expectedStudyMinutes) || expectedStudyMinutes <= 0) return 'tbd'
    if (expectedStudyMinutes <= 120) return 'short'
    if (expectedStudyMinutes <= 360) return 'medium'
    return 'long'
}

function summarizeTrack(track) {
    const lessonCount = track.topics.reduce((count, topic) => count + topic.lessons.length, 0)
    const questionCount = track.topics.reduce((count, topic) => count + (topic._count?.questions || 0), 0)
    const estimatedMinutes = track.topics.reduce(
        (total, topic) => total + topic.lessons.reduce((topicTotal, lesson) => topicTotal + (lesson.estMinutes || 0), 0),
        0,
    )
    const practiceMinutes = questionCount > 0 ? Math.round(questionCount * 1.5) : 0
    const expectedStudyMinutes = estimatedMinutes + practiceMinutes
    const frameworks = track.trackFrameworks.map((entry) => ({
        slug: entry.framework.slug,
        title: entry.framework.title,
    }))

    return {
        id: track.id,
        slug: track.slug,
        title: track.title,
        description: track.description,
        category: track.category,
        frameworks,
        learningGoal: LEARNING_GOAL_LABELS[track.category] || 'Structured learning',
        lessonCount,
        questionCount,
        estimatedMinutes,
        practiceMinutes,
        expectedStudyMinutes: expectedStudyMinutes > 0 ? expectedStudyMinutes : null,
        expectedStudyBand: getStudyTimeBand(expectedStudyMinutes),
    }
}

function scoreTrack(track, primaryGoal, confidenceBefore, weeklyTime) {
    const goalMeta = getGoalMeta(primaryGoal)
    const weeklyTimeMeta = getWeeklyTimeMeta(weeklyTime)
    const normalizedConfidence = normalizeConfidence(confidenceBefore) || 3
    const summary = summarizeTrack(track)
    const haystack = [
        summary.slug,
        summary.title,
        summary.description || '',
        ...summary.frameworks.map((framework) => framework.slug),
        ...summary.frameworks.map((framework) => framework.title),
    ].join(' ').toLowerCase()

    let score = 0
    const reasons = []

    if (goalMeta.preferredSlugs.includes(summary.slug)) {
        score += 120
        reasons.push('Strong match for the goal you chose.')
    }

    if (goalMeta.preferredCategories.includes(summary.category)) {
        score += 40
    }

    if (summary.frameworks.some((framework) => goalMeta.preferredFrameworks.includes(framework.slug))) {
        score += 35
    }

    const keywordMatches = goalMeta.keywords.filter((keyword) => haystack.includes(keyword)).length
    score += keywordMatches * 12
    if (keywordMatches > 0) {
        reasons.push('Content focus lines up with your stated next step.')
    }

    if (weeklyTimeMeta.preferredBands.includes(summary.expectedStudyBand)) {
        score += 18
        reasons.push('The study load should fit the weekly time you said you have.')
    }

    if (normalizedConfidence <= 2 && ['short', 'medium'].includes(summary.expectedStudyBand)) {
        score += 20
        reasons.push('A manageable starting load suits a lower-confidence start.')
    }

    if (normalizedConfidence >= 4 && ['medium', 'long'].includes(summary.expectedStudyBand)) {
        score += 12
    }

    if (summary.questionCount >= 20) {
        score += 8
        reasons.push('Includes enough practice to reinforce learning, not just reading.')
    }

    if (/foundation|essential|introduction|everyone/i.test(summary.title) && normalizedConfidence <= 3) {
        score += 10
    }

    if (/life in the uk/i.test(summary.title)) {
        reasons.push('Supports citizenship and practical life-readiness directly.')
    } else if (summary.category === 'workplace') {
        reasons.push('Supports practical, everyday, and work-related capability.')
    } else if (summary.category === 'tech') {
        reasons.push('Builds technical foundations through a structured route.')
    }

    const uniqueReasons = Array.from(new Set(reasons)).slice(0, 3)

    return {
        ...summary,
        score,
        reasons: uniqueReasons,
    }
}

export function recommendTracks({ tracks, primaryGoal, confidenceBefore, weeklyTime }) {
    return tracks
        .map((track) => scoreTrack(track, primaryGoal, confidenceBefore, weeklyTime))
        .sort((left, right) => {
            if (right.score !== left.score) return right.score - left.score
            if ((left.expectedStudyMinutes || Number.MAX_SAFE_INTEGER) !== (right.expectedStudyMinutes || Number.MAX_SAFE_INTEGER)) {
                return (left.expectedStudyMinutes || Number.MAX_SAFE_INTEGER) - (right.expectedStudyMinutes || Number.MAX_SAFE_INTEGER)
            }
            return left.title.localeCompare(right.title)
        })
}

function sanitizeTrackSnapshot(track) {
    if (!track) return null

    return {
        id: track.id,
        slug: track.slug,
        title: track.title,
        category: track.category,
        learningGoal: track.learningGoal,
        expectedStudyMinutes: track.expectedStudyMinutes || null,
        expectedStudyBand: track.expectedStudyBand || 'tbd',
        questionCount: track.questionCount || 0,
        framework: track.frameworks?.[0]?.slug || null,
    }
}

export function normalizeLearnerProfile(snapshot) {
    if (!snapshot) return null

    const confidenceBefore = normalizeConfidence(snapshot.confidenceBefore)
    const confidenceAfter = normalizeConfidence(snapshot.confidenceAfter)
    const startingPoint = snapshot.currentStartingPoint || getStartingPoint(confidenceBefore)
    const completed = Boolean(snapshot.primaryGoal && confidenceBefore && snapshot.selectedTrack?.slug)

    return {
        primaryGoal: snapshot.primaryGoal || null,
        goalLabel: snapshot.primaryGoal ? getGoalMeta(snapshot.primaryGoal).label : null,
        confidenceBefore,
        weeklyTime: snapshot.weeklyTime || null,
        weeklyTimeLabel: snapshot.weeklyTime ? getWeeklyTimeMeta(snapshot.weeklyTime).label : null,
        currentStartingPoint: startingPoint,
        recommendedTrack: sanitizeTrackSnapshot(snapshot.recommendedTrack),
        selectedTrack: sanitizeTrackSnapshot(snapshot.selectedTrack),
        completedTrack: sanitizeTrackSnapshot(snapshot.completedTrack),
        recommendedLevel: snapshot.recommendedLevel || null,
        referralSource: snapshot.referralSource || null,
        cohortTag: snapshot.cohortTag || null,
        organizationTag: snapshot.organizationTag || null,
        nextStepChoice: snapshot.nextStepChoice || null,
        confidenceAfter,
        confidenceChange: confidenceBefore && confidenceAfter ? confidenceAfter - confidenceBefore : null,
        outcomeRecordedAt: snapshot.outcomeRecordedAt || null,
        completedAt: snapshot.completedAt || null,
        updatedAt: snapshot.updatedAt || null,
        completed,
        needsOnboarding: !completed,
    }
}

export async function getLearnerProfile(prisma, userId) {
    const snapshotEvent = await prisma.analyticsEvent.findFirst({
        where: {
            userId,
            eventType: PROFILE_SNAPSHOT_EVENT,
        },
        orderBy: { createdAt: 'desc' },
    })

    if (!snapshotEvent) return null

    return normalizeLearnerProfile(safeParseJson(snapshotEvent.metadata, {}))
}

export async function saveLearnerProfileSnapshot(prisma, userId, updates, source = 'onboarding') {
    const existingProfile = await getLearnerProfile(prisma, userId)
    const now = new Date().toISOString()
    const merged = normalizeLearnerProfile({
        ...(existingProfile || {}),
        ...updates,
        updatedAt: now,
        source,
    })

    const completedProfile = {
        ...merged,
        completedAt: merged.completed ? (merged.completedAt || now) : merged.completedAt,
    }

    await prisma.analyticsEvent.create({
        data: {
            userId,
            eventType: PROFILE_SNAPSHOT_EVENT,
            metadata: JSON.stringify(completedProfile),
        },
    })

    return completedProfile
}

export async function recordOnboardingCompletion(prisma, userId, metadata) {
    await prisma.analyticsEvent.create({
        data: {
            userId,
            eventType: ONBOARDING_COMPLETED_EVENT,
            metadata: JSON.stringify(metadata),
        },
    })
}

export async function recordProgressionOutcome(prisma, userId, metadata) {
    await prisma.analyticsEvent.create({
        data: {
            userId,
            eventType: PROGRESSION_OUTCOME_EVENT,
            metadata: JSON.stringify(metadata),
        },
    })
}

export async function buildAuthUser(prisma, user) {
    const onboarding = await getLearnerProfile(prisma, user.id)

    return {
        id: user.id,
        email: user.email,
        emailVerified: Boolean(user.emailVerifiedAt),
        emailVerifiedAt: user.emailVerifiedAt || null,
        verificationEmailSentAt: user.verificationEmailSentAt || null,
        role: user.role,
        displayName: user.displayName,
        organizationId: user.organizationId || null,
        needsOnboarding: onboarding?.needsOnboarding ?? true,
        onboarding,
    }
}

export async function fetchLiveTracksForOnboarding(prisma) {
    return prisma.track.findMany({
        where: { isLive: true },
        include: {
            trackFrameworks: {
                include: {
                    framework: true,
                },
            },
            topics: {
                select: {
                    lessons: {
                        where: { isPublished: true },
                        select: { estMinutes: true },
                    },
                    _count: {
                        select: { questions: { where: { isPublished: true } } },
                    },
                },
            },
        },
        orderBy: { title: 'asc' },
    })
}

export function createOnboardingSummary({ primaryGoal, confidenceBefore, weeklyTime }) {
    return {
        primaryGoal,
        goalLabel: getGoalMeta(primaryGoal).label,
        confidenceBefore: normalizeConfidence(confidenceBefore),
        weeklyTime,
        weeklyTimeLabel: getWeeklyTimeMeta(weeklyTime).label,
        currentStartingPoint: getStartingPoint(confidenceBefore),
    }
}