export function getPublishedTopicQuestionCount(topic) {
    return topic?.publishedQuestionCount ?? topic?._count?.questions ?? 0
}

export function hasPublishedTopicContent(topic) {
    return (topic?.lessons?.length || 0) > 0 || getPublishedTopicQuestionCount(topic) > 0
}

export function visibleTopicsForLearner(topics = []) {
    return topics.filter(hasPublishedTopicContent)
}
