import { expect } from 'chai'
import { candidateObjectives, metadataPrompt, parseJson, validateMetadataItems } from '../scripts/propose-question-metadata.js'

const plan = {
    tracks: {
        'gcse-maths': {
            sources: [{ title: 'National curriculum mathematics', url: 'https://www.gov.uk/math' }],
        },
    },
}

const question = {
    id: 'q1',
    version: 2,
    prompt: 'What is 2 + 2?',
    options: JSON.stringify(['3', '4', '5', '6']),
    answer: '1',
    explanation: 'Two plus two is four.',
    topic: {
        title: 'Number',
        track: { slug: 'gcse-maths', title: 'GCSE Maths' },
        topicOutcomes: [{ outcome: { code: 'N1', title: 'Use number operations', description: 'Apply the four operations to calculate with numbers.' } }],
    },
}

describe('question metadata proposals', () => {
    it('parses JSON option values', () => {
        expect(parseJson('[1,2]')).to.deep.equal([1, 2])
        expect(parseJson('not-json')).to.equal(null)
    })

    it('accepts only linked outcomes and mapped sources', () => {
        const result = validateMetadataItems([{
            id: 'q1', decision: 'match', sourceIndex: 0, objectiveCode: 'N1', reason: 'The item tests number operations.',
        }], [question], plan)
        expect(result[0].source.url).to.equal('https://www.gov.uk/math')
        expect(result[0].objective.code).to.equal('N1')
        expect(result[0].approved).to.equal(false)
    })

    it('rejects an invented objective code', () => {
        expect(() => validateMetadataItems([{
            id: 'q1', decision: 'match', sourceIndex: 0, objectiveCode: 'MADE-UP', reason: 'x',
        }], [question], plan)).to.throw('not linked')
    })

    it('constrains the model prompt to approved evidence', () => {
        const prompt = metadataPrompt([question], plan)
        expect(prompt).to.include('Never invent a source URL')
        expect(prompt).to.include('N1')
        expect(prompt).to.include('https://www.gov.uk/math')
    })

    it('prefers objectives from the checked specification when available', () => {
        const candidates = candidateObjectives(question, {
            'gcse-maths': [{ code: 'SPEC-N1', text: 'Use number operations accurately.', unitKey: 'number operations' }],
        })
        expect(candidates.map((item) => item.code)).to.deep.equal(['SPEC-N1'])
    })
})
