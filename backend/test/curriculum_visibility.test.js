import { expect } from 'chai'
import {
    getPublishedTopicQuestionCount,
    hasPublishedTopicContent,
    visibleTopicsForLearner,
} from '../src/lib/curriculumVisibility.js'

describe('Curriculum visibility', () => {
    it('keeps topics with a published lesson or published practice question', () => {
        const lessonTopic = { id: 'lesson', lessons: [{ id: 'lesson-1' }], publishedQuestionCount: 0 }
        const practiceTopic = { id: 'practice', lessons: [], publishedQuestionCount: 3 }
        const emptyTopic = { id: 'draft-only', lessons: [], publishedQuestionCount: 0 }

        expect(visibleTopicsForLearner([lessonTopic, practiceTopic, emptyTopic]))
            .to.deep.equal([lessonTopic, practiceTopic])
    })

    it('supports Prisma question-count results and treats missing data as empty', () => {
        expect(getPublishedTopicQuestionCount({ _count: { questions: 2 } })).to.equal(2)
        expect(hasPublishedTopicContent({ lessons: [], _count: { questions: 2 } })).to.equal(true)
        expect(hasPublishedTopicContent({})).to.equal(false)
    })
})
