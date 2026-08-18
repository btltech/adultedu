/**
 * Content trust audit for published question banks.
 *
 * This does not replace subject-expert review. It flags patterns that usually
 * reduce learner trust: broken answers, weak explanations, duplicate prompts,
 * stale date claims, and low topic coverage.
 *
 * Usage:
 *   node scripts/audit-content-trust.js
 *   node scripts/audit-content-trust.js --track=life-in-the-uk-test
 */

import { PrismaClient } from '@prisma/client'
import {
    canonicalizeMcqAnswer,
    dedupeExactOptions,
    normalizeTextStrict,
    safeJsonParse,
    stableReportId,
    storedAnswerResolvesAgainstOptions,
} from './questionQualityUtils.js'
import { publicationReadinessIssues } from '../src/lib/contentQuality.js'

const prisma = new PrismaClient()

const SHORT_EXPLANATION_MIN_LENGTH = 45
const MIN_PUBLISHED_QUESTIONS_PER_TOPIC = 20
const STALE_AS_OF_PATTERN = /\b(as of|as at)\s+(?:[a-z]+\s+)?20\d{2}\b/i
const STALE_RECENCY_PATTERN = /\b(currently|latest)\b|\btoday(?:'s)?\b|\bnow\s+(?:part of|known as|called|requires?|available|includes?|means|operates?|uses?|has|is)\b|\brecent\s+(estimate|figure|data|statistic|change|law|legislation|policy|guidance|update)s?\b/i
const YEAR_PATTERN = /\b20(1[0-9]|2[0-4])\b/i
const VOLATILE_FACT_PATTERN = /\b(minimum wage|living wage|population|tax credit|universal credit|benefit|allowance|threshold|fee|cost|interest rate|government support|immigration|asylum|visa|employment law|nhs charge|prescription charge)\b/i
const OUTCOME_GUARANTEE_PATTERN = /\b(will pass|guarantee(?:d|s)?\s+(?:a\s+)?(?:pass|result|score|qualification|job|employment|citizenship|settlement|visa|success)|exam board approved)\b/i
const AFFILIATION_CLAIM_PATTERN = /\bofficial\s+(?:adultedu|practice|mock|test|exam|provider|resource|partner|gov\.uk|government|home office|exam board|awarding body)\b/i

function parseArgs(argv) {
    const args = new Map()
    for (const part of argv.slice(2)) {
        if (!part.startsWith('--')) continue
        const [key, value] = part.split('=')
        args.set(key, value ?? true)
    }
    return args
}

function addSample(samples, key, question, extra = {}) {
    if (!samples[key]) samples[key] = []
    if (samples[key].length >= 12) return

    samples[key].push({
        id: question.id,
        track: question.topic?.track?.slug || null,
        topic: question.topic?.title || null,
        prompt: String(question.prompt || '').slice(0, 160),
        ...extra,
    })
}

function increment(issues, key) {
    issues[key] = (issues[key] || 0) + 1
}

function normalizePromptKey(question) {
    return normalizeTextStrict(question.prompt)
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

function findTimeSensitiveClaim(text) {
    if (STALE_AS_OF_PATTERN.test(text)) return 'explicit_as_of_date'
    if (STALE_RECENCY_PATTERN.test(text)) return 'recency_wording'
    if (YEAR_PATTERN.test(text) && VOLATILE_FACT_PATTERN.test(text)) return 'dated_volatile_fact'
    return null
}

function findOfficialOrGuaranteeClaim(text) {
    if (OUTCOME_GUARANTEE_PATTERN.test(text)) return 'outcome_guarantee'
    if (AFFILIATION_CLAIM_PATTERN.test(text)) return 'affiliation_or_official_resource_claim'
    return null
}

async function main() {
    const args = parseArgs(process.argv)
    const trackSlug = args.get('--track') === true ? null : args.get('--track')
    const reportId = stableReportId('content-trust')

    const tracks = await prisma.track.findMany({
        where: {
            isLive: true,
            ...(trackSlug ? { slug: String(trackSlug) } : {}),
        },
        include: {
            topics: {
                orderBy: { sortOrder: 'asc' },
                include: {
                    ukLevel: { select: { code: true } },
                    questions: {
                        where: { isPublished: true },
                        include: {
                            ukLevel: { select: { code: true } },
                            topic: {
                                include: {
                                    track: { select: { slug: true } },
                                },
                            },
                        },
                    },
                },
            },
        },
        orderBy: { title: 'asc' },
    })

    const issues = {}
    const samples = {}
    const duplicatePromptBuckets = new Map()
    const topicCoverage = []
    let totalPublishedQuestions = 0

    for (const track of tracks) {
        for (const topic of track.topics) {
            const publishedCount = topic.questions.length
            totalPublishedQuestions += publishedCount
            topicCoverage.push({
                track: track.slug,
                topicId: topic.id,
                topic: topic.title,
                publishedQuestions: publishedCount,
            })

            if (publishedCount < MIN_PUBLISHED_QUESTIONS_PER_TOPIC) {
                increment(issues, 'lowTopicCoverage')
                if (!samples.lowTopicCoverage) samples.lowTopicCoverage = []
                if (samples.lowTopicCoverage.length < 12) {
                    samples.lowTopicCoverage.push({
                        track: track.slug,
                        topicId: topic.id,
                        topic: topic.title,
                        publishedQuestions: publishedCount,
                    })
                }
            }

            for (const question of topic.questions) {
                const promptKey = normalizePromptKey(question)
                if (promptKey) {
                    const bucket = duplicatePromptBuckets.get(promptKey) || []
                    bucket.push(question)
                    duplicatePromptBuckets.set(promptKey, bucket)
                }

                if (String(question.prompt || '').trim().length < 18) {
                    increment(issues, 'shortPrompt')
                    addSample(samples, 'shortPrompt', question)
                }

                if (String(question.explanation || '').trim().length < SHORT_EXPLANATION_MIN_LENGTH) {
                    increment(issues, 'weakExplanation')
                    addSample(samples, 'weakExplanation', question, {
                        explanationLength: String(question.explanation || '').trim().length,
                    })
                }

                const publicationIssues = publicationReadinessIssues(question, new Date(), { allowLegacy: true })
                if (publicationIssues.length > 0) {
                    increment(issues, 'missingOrExpiredReviewRecord')
                    addSample(samples, 'missingOrExpiredReviewRecord', question, {
                        reviewStatus: question.reviewStatus,
                        reasons: publicationIssues,
                    })
                }

                const combinedText = `${question.prompt || ''} ${question.explanation || ''}`
                const timeSensitiveReason = findTimeSensitiveClaim(combinedText)
                if (timeSensitiveReason) {
                    increment(issues, 'timeSensitiveClaim')
                    addSample(samples, 'timeSensitiveClaim', question, { reason: timeSensitiveReason })
                }

                const officialClaimReason = findOfficialOrGuaranteeClaim(combinedText)
                if (officialClaimReason) {
                    increment(issues, 'officialOrGuaranteeClaim')
                    addSample(samples, 'officialOrGuaranteeClaim', question, { reason: officialClaimReason })
                }

                if (!['mcq', 'true_false', 'multi_select', 'scenario'].includes(question.type)) continue

                const optionsParsed = safeJsonParse(question.options)
                if (!optionsParsed.ok || !Array.isArray(optionsParsed.value)) {
                    increment(issues, 'invalidOptionsJson')
                    addSample(samples, 'invalidOptionsJson', question)
                    continue
                }

                const options = optionsParsed.value
                if (question.type === 'mcq' && options.length !== 4) {
                    increment(issues, 'mcqNotFourOptions')
                    addSample(samples, 'mcqNotFourOptions', question, { optionCount: options.length })
                }

                if (dedupeExactOptions(options).length !== options.length) {
                    increment(issues, 'duplicateOptions')
                    addSample(samples, 'duplicateOptions', question)
                }

                if ((question.type === 'mcq' || question.type === 'true_false') && !storedAnswerResolvesAgainstOptions(question.answer, options)) {
                    increment(issues, 'storedAnswerNotResolvable')
                    addSample(samples, 'storedAnswerNotResolvable', question)
                }

                if (question.type === 'mcq' || question.type === 'true_false') {
                    const canonical = canonicalizeMcqAnswer({
                        options: question.options,
                        answerRaw: question.answer,
                        explanation: question.explanation,
                    })

                    if (!canonical.ok) {
                        increment(issues, `canonicalAnswer_${canonical.reason}`)
                        addSample(samples, `canonicalAnswer_${canonical.reason}`, question)
                    }

                    if (canonical.reason === 'explanation_contradiction') {
                        increment(issues, 'answerContradictsExplanation')
                        addSample(samples, 'answerContradictsExplanation', question)
                    }
                }
            }
        }
    }

    for (const duplicateQuestions of duplicatePromptBuckets.values()) {
        if (duplicateQuestions.length <= 1) continue
        increment(issues, 'duplicatePromptExact')
        if (!samples.duplicatePromptExact) samples.duplicatePromptExact = []
        if (samples.duplicatePromptExact.length < 12) {
            samples.duplicatePromptExact.push({
                prompt: duplicateQuestions[0].prompt.slice(0, 160),
                count: duplicateQuestions.length,
                ids: duplicateQuestions.slice(0, 5).map((question) => question.id),
                tracks: [...new Set(duplicateQuestions.map((question) => question.topic?.track?.slug).filter(Boolean))],
            })
        }
    }

    const report = {
        reportId,
        track: trackSlug || 'all-live-tracks',
        generatedAt: new Date().toISOString(),
        summary: {
            tracks: tracks.length,
            topics: topicCoverage.length,
            publishedQuestions: totalPublishedQuestions,
            issueTypes: Object.keys(issues).length,
            totalIssueCount: Object.values(issues).reduce((sum, count) => sum + count, 0),
        },
        issues,
        topicCoverage: topicCoverage.sort((left, right) => left.publishedQuestions - right.publishedQuestions).slice(0, 20),
        samples,
        note: 'This is an automated trust-risk audit. Use it to prioritize review and learner-report follow-up; do not treat it as proof of factual correctness. Published content with reviewStatus=legacy is historical public content, not a claim of human approval.',
    }

    console.log(JSON.stringify(report, null, 2))
}

main()
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
