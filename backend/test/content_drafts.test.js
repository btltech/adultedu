import { expect } from 'chai'
import { createDraftPrompt, validateLessonDraft } from '../src/lib/contentDrafts.js'

const unit = {
    id: 'fse-l1-reading-fact-opinion-purpose',
    title: 'Reading: fact, opinion, purpose and audience',
    description: 'Practice reading skills.',
    sectionCount: 3,
    practiceCount: 3,
    source: {
        title: 'English Functional Skills: subject content',
        url: 'https://www.gov.uk/government/publications/functional-skills-subject-content-english/english-functional-skills-subject-content',
        checkedAt: '2026-08-16',
    },
    objectives: [
        { code: 'FSE-L1-R11', text: 'Distinguish between fact and opinion.' },
    ],
}

const validDraft = {
    title: 'Fact and opinion',
    summary: 'Learn to tell factual statements from opinions.',
    sourceUrl: unit.source.url,
    sourceTitle: unit.source.title,
    objectives: unit.objectives,
    sections: [
        { heading: 'Facts', body: 'A fact is a statement that can be checked against reliable evidence. In a short notice, it may give a time, place, date or instruction. Read the whole sentence carefully and notice what information the writer actually provides before deciding how to describe the statement.' },
        { heading: 'Opinions', body: 'An opinion expresses a personal view, judgement or preference. It may use words such as best, should, useful or disappointing. The reader can identify that it is an opinion without agreeing or disagreeing. Compare the wording with the evidence that is actually stated in the text.' },
        { heading: 'Compare carefully', body: 'When you compare statements, identify what each text says before you choose an answer. A useful comparison names the information or view in both texts. Avoid adding facts that are not in the stimulus. This keeps your explanation focused on the words a reader can see.' },
    ],
    practice: [{
        prompt: 'Which sentence is an opinion?',
        options: ['The shop opens at 9am.', 'The shop has two doors.', 'This is the best shop in town.', 'The shop is on King Street.'],
        correctIndex: 2,
        explanation: 'Best expresses a personal judgement.',
        objectiveCode: 'FSE-L1-R11',
    }, {
        prompt: 'Read this notice: The shop closes at 5pm. Which detail gives a time?',
        options: ['The shop', 'closes', 'at 5pm', 'detail'],
        correctIndex: 2,
        explanation: 'At 5pm gives the closing time.',
        objectiveCode: 'FSE-L1-R11',
    }, {
        prompt: 'Read this message: I think the new café is useful. Which word signals a view?',
        options: ['I', 'think', 'new', 'café'],
        correctIndex: 1,
        explanation: 'Think signals the writer’s personal view.',
        objectiveCode: 'FSE-L1-R11',
    }],
}

describe('local content draft safeguards', () => {
    it('creates a prompt that limits generation to its approved source and objectives', () => {
        const prompt = createDraftPrompt(unit)
        expect(prompt).to.include(unit.source.url)
        expect(prompt).to.include('FSE-L1-R11')
        expect(prompt).to.include('not an exam, a qualification, or an official assessment')
        expect(prompt).to.include('fictional reading stimulus of no more than two sentences')
        expect(prompt).to.include('never repeat answer options inside the prompt')
    })

    it('accepts a structurally valid source-backed draft', () => {
        expect(validateLessonDraft(validDraft, unit)).to.equal(validDraft)
    })

    it('rejects a changed source and duplicate answer options', () => {
        expect(() => validateLessonDraft({ ...validDraft, sourceUrl: 'https://example.com' }, unit))
            .to.throw('changed the approved source URL')

        const duplicateOptions = structuredClone(validDraft)
        duplicateOptions.practice[0].options[3] = duplicateOptions.practice[0].options[0]
        expect(() => validateLessonDraft(duplicateOptions, unit))
            .to.throw('Practice options must be distinct')
    })

    it('removes a repeated answer list when it exactly matches the options field', () => {
        const duplicatedChoices = structuredClone(validDraft)
        duplicatedChoices.practice[0].prompt = 'Read this notice. A. The shop opens at 9am. B. The shop has two doors. C. This is the best shop in town. D. The shop is on King Street.'
        validateLessonDraft(duplicatedChoices, unit)
        expect(duplicatedChoices.practice[0].prompt).to.equal('Read this notice.')
    })

    it('rejects a conflicting answer list inside a practice prompt', () => {
        const conflictingChoices = structuredClone(validDraft)
        conflictingChoices.practice[0].prompt = 'Read this notice. A. First option B. Second option C. Third option D. Fourth option'
        expect(() => validateLessonDraft(conflictingChoices, unit))
            .to.throw('conflicting embedded answer list')
    })

    it('requires a self-review activity for writing units without treating it as a marked answer', () => {
        const writingUnit = { ...unit, requiresWritingActivity: true }
        expect(createDraftPrompt(writingUnit)).to.include('"writingActivity"')
        expect(createDraftPrompt(writingUnit)).to.include('Do not provide a model answer, score, grade, pass mark')
        expect(() => validateLessonDraft(validDraft, writingUnit)).to.throw('needs a writingActivity')

        const writingDraft = structuredClone(validDraft)
        writingDraft.writingActivity = {
            title: 'Write a short message',
            prompt: 'Write a message to a colleague about a changed meeting time.',
            wordGuide: '40 to 60 words',
            checklist: ['The purpose is clear.', 'The message has enough detail.', 'I checked my punctuation.'],
        }
        expect(validateLessonDraft(writingDraft, writingUnit)).to.equal(writingDraft)
    })

    it('requires a private self-review activity for speaking units', () => {
        const speakingUnit = { ...unit, requiresSpeakingActivity: true }
        expect(createDraftPrompt(speakingUnit)).to.include('"speakingActivity"')
        expect(createDraftPrompt(speakingUnit)).to.include('private self-recorded practice')
        expect(() => validateLessonDraft(validDraft, speakingUnit)).to.throw('needs a speakingActivity')

        const speakingDraft = structuredClone(validDraft)
        speakingDraft.speakingActivity = {
            title: 'Explain a change',
            prompt: 'Explain a change to a colleague and invite one question.',
            timingGuide: 'About one minute',
            checklist: ['I stated the main information.', 'I used a suitable tone.', 'I paused to invite a question.'],
        }
        expect(validateLessonDraft(speakingDraft, speakingUnit)).to.equal(speakingDraft)
    })
})
