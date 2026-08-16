import { normalizeLearnerProfile } from './learnerOnboarding.js'

const PROFILE_SNAPSHOT_EVENT = 'learner_profile_snapshot'

function safeParseJson(value, fallback = null) {
    if (!value) return fallback

    try {
        return JSON.parse(value)
    } catch {
        return fallback
    }
}

function normalizeFilter(value) {
    return String(value || '').trim().toLowerCase()
}

function matchesFilters(row, filters) {
    const search = normalizeFilter(filters.search)
    if (search) {
        const haystack = [
            row.email,
            row.displayName || '',
            row.organizationTag || '',
            row.cohortTag || '',
            row.referralSource || '',
            row.selectedTrackTitle || '',
            row.goalLabel || '',
        ].join(' ').toLowerCase()

        if (!haystack.includes(search)) return false
    }

    if (filters.organizationTag && row.organizationTag !== filters.organizationTag) return false
    if (filters.cohortTag && row.cohortTag !== filters.cohortTag) return false
    if (filters.referralSource && row.referralSource !== filters.referralSource) return false

    return true
}

function toTitleCase(value) {
    return String(value || '')
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ')
}

function escapeCsvCell(value) {
    const stringValue = value === null || value === undefined ? '' : String(value)
    if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`
    }
    return stringValue
}

function toCsv(rows) {
    const headers = [
        'email',
        'displayName',
        'organizationTag',
        'cohortTag',
        'referralSource',
        'goalLabel',
        'selectedTrackTitle',
        'recommendedLevel',
        'baselineConfidence',
        'confidenceAfter',
        'confidenceChange',
        'pathwayProgressPercent',
        'pathwayCompleted',
        'nextStepChoice',
        'createdAt',
        'updatedAt',
        'outcomeRecordedAt',
    ]

    const lines = [headers.join(',')]

    rows.forEach((row) => {
        lines.push(headers.map((header) => escapeCsvCell(row[header])).join(','))
    })

    return lines.join('\n')
}

function getUniqueValues(rows, key) {
    return Array.from(new Set(rows.map((row) => row[key]).filter(Boolean))).sort((left, right) => left.localeCompare(right))
}

export async function buildPartnerOverview(prisma, filters = {}) {
    const users = await prisma.user.findMany({
        where: {
            role: { not: 'admin' },
        },
        include: {
            organization: true,
            certificates: {
                select: {
                    trackId: true,
                    awardedAt: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    })

    if (users.length === 0) {
        return {
            summary: {
                learners: 0,
                onboardingCompleted: 0,
                partnerTagged: 0,
                pathwayCompleted: 0,
                outcomeRecorded: 0,
                avgConfidenceChange: null,
            },
            availableFilters: {
                organizationTags: [],
                cohortTags: [],
                referralSources: [],
            },
            learners: [],
            csv: 'email,displayName,organizationTag,cohortTag,referralSource,goalLabel,selectedTrackTitle,recommendedLevel,baselineConfidence,confidenceAfter,confidenceChange,pathwayProgressPercent,pathwayCompleted,nextStepChoice,createdAt,updatedAt,outcomeRecordedAt',
        }
    }

    const userIds = users.map((user) => user.id)

    const snapshotEvents = await prisma.analyticsEvent.findMany({
        where: {
            userId: { in: userIds },
            eventType: PROFILE_SNAPSHOT_EVENT,
        },
        orderBy: [
            { userId: 'asc' },
            { createdAt: 'desc' },
        ],
    })

    const latestProfiles = new Map()
    snapshotEvents.forEach((event) => {
        if (latestProfiles.has(event.userId)) return
        latestProfiles.set(event.userId, normalizeLearnerProfile(safeParseJson(event.metadata, {})))
    })

    const selectedTrackIds = Array.from(new Set(
        Array.from(latestProfiles.values())
            .map((profile) => profile?.selectedTrack?.id)
            .filter(Boolean)
    ))

    const tracks = selectedTrackIds.length > 0
        ? await prisma.track.findMany({
            where: { id: { in: selectedTrackIds } },
            include: {
                topics: {
                    select: {
                        _count: {
                            select: { questions: { where: { isPublished: true } } },
                        },
                    },
                },
            },
        })
        : []

    const trackQuestionTotals = new Map(
        tracks.map((track) => [
            track.id,
            track.topics.reduce((sum, topic) => sum + (topic._count?.questions || 0), 0),
        ])
    )

    const correctAttempts = selectedTrackIds.length > 0
        ? await prisma.attempt.findMany({
            where: {
                userId: { in: userIds },
                isCorrect: true,
                question: {
                    topic: {
                        trackId: { in: selectedTrackIds },
                    },
                },
            },
            select: {
                userId: true,
                questionId: true,
                question: {
                    select: {
                        topic: {
                            select: {
                                trackId: true,
                            },
                        },
                    },
                },
            },
        })
        : []

    const correctAttemptCounts = new Map()
    const seenQuestionKeys = new Set()

    correctAttempts.forEach((attempt) => {
        const trackId = attempt.question?.topic?.trackId
        if (!trackId) return

        const questionKey = `${attempt.userId}:${trackId}:${attempt.questionId}`
        if (seenQuestionKeys.has(questionKey)) return
        seenQuestionKeys.add(questionKey)

        const countKey = `${attempt.userId}:${trackId}`
        correctAttemptCounts.set(countKey, (correctAttemptCounts.get(countKey) || 0) + 1)
    })

    const allRows = users.map((user) => {
        const profile = latestProfiles.get(user.id)
        const selectedTrackId = profile?.selectedTrack?.id || null
        const pathwayTotalQuestions = selectedTrackId ? (trackQuestionTotals.get(selectedTrackId) || 0) : 0
        const correctCount = selectedTrackId ? (correctAttemptCounts.get(`${user.id}:${selectedTrackId}`) || 0) : 0
        const pathwayProgressPercent = pathwayTotalQuestions > 0
            ? Math.round((correctCount / pathwayTotalQuestions) * 100)
            : 0
        const pathwayCompleted = selectedTrackId
            ? user.certificates.some((certificate) => certificate.trackId === selectedTrackId) || pathwayProgressPercent >= 80
            : false
        const organizationTag = profile?.organizationTag || user.organization?.name || ''
        const outcomeRecorded = Boolean(profile?.outcomeRecordedAt || profile?.confidenceAfter || profile?.completedTrack?.slug)

        return {
            userId: user.id,
            email: user.email,
            displayName: user.displayName || '',
            organizationTag,
            cohortTag: profile?.cohortTag || '',
            referralSource: profile?.referralSource || '',
            goalLabel: profile?.goalLabel || '',
            selectedTrackTitle: profile?.selectedTrack?.title || '',
            selectedTrackSlug: profile?.selectedTrack?.slug || '',
            recommendedLevel: profile?.recommendedLevel?.title || profile?.recommendedLevel?.code || '',
            baselineConfidence: profile?.confidenceBefore || '',
            confidenceAfter: profile?.confidenceAfter || '',
            confidenceChange: profile?.confidenceChange ?? '',
            pathwayProgressPercent,
            pathwayCompleted,
            onboardingCompleted: Boolean(profile && !profile.needsOnboarding),
            partnerTagged: Boolean(organizationTag || profile?.cohortTag || profile?.referralSource),
            nextStepChoice: profile?.nextStepChoice ? toTitleCase(profile.nextStepChoice) : '',
            createdAt: user.createdAt.toISOString(),
            updatedAt: profile?.updatedAt || '',
            outcomeRecordedAt: profile?.outcomeRecordedAt || '',
            outcomeRecorded,
        }
    })

    const learners = allRows.filter((row) => matchesFilters(row, filters))
    const confidenceChanges = learners
        .map((row) => Number(row.confidenceChange))
        .filter((value) => Number.isFinite(value))

    return {
        summary: {
            learners: learners.length,
            onboardingCompleted: learners.filter((row) => row.onboardingCompleted).length,
            partnerTagged: learners.filter((row) => row.partnerTagged).length,
            pathwayCompleted: learners.filter((row) => row.pathwayCompleted).length,
            outcomeRecorded: learners.filter((row) => row.outcomeRecorded).length,
            avgConfidenceChange: confidenceChanges.length > 0
                ? Number((confidenceChanges.reduce((sum, value) => sum + value, 0) / confidenceChanges.length).toFixed(1))
                : null,
        },
        availableFilters: {
            organizationTags: getUniqueValues(allRows, 'organizationTag'),
            cohortTags: getUniqueValues(allRows, 'cohortTag'),
            referralSources: getUniqueValues(allRows, 'referralSource'),
        },
        learners,
        csv: toCsv(learners),
    }
}