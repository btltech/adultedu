import prisma from './db.js'

export async function getPublishedQuestionCountMap(topicIds) {
    const uniqueTopicIds = [...new Set((topicIds || []).filter(Boolean))]

    if (uniqueTopicIds.length === 0) {
        return new Map()
    }

    const rows = await prisma.question.groupBy({
        by: ['topicId'],
        where: {
            topicId: { in: uniqueTopicIds },
            isPublished: true,
        },
        _count: {
            _all: true,
        },
    })

    return new Map(rows.map((row) => [row.topicId, row._count._all]))
}

export function attachPublishedQuestionCounts(topics, countMap) {
    return topics.map((topic) => ({
        ...topic,
        publishedQuestionCount: countMap.get(topic.id) || 0,
    }))
}