/**
 * Generate a source-backed lesson draft using LM Studio.
 *
 * This tool NEVER connects to Prisma and NEVER publishes content.
 * Review the JSON bundle, then use the admin review workflow to create and
 * approve individual learner-facing records.
 *
 * Example:
 * LLM_API_URL=http://192.168.0.165:1234 \
 * LLM_MODEL=qwen/qwen3.8-27b \
 * node scripts/generate-content-draft.js \
 *   --spec=content-specs/functional-skills-english-level-1.json \
 *   --unit=fse-l1-reading-fact-opinion-purpose \
 *   --out=exports/drafts/fse-l1-reading-fact-opinion-purpose.json
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { generateLessonDraft } from '../src/lib/contentDrafts.js'

function argument(name) {
    const prefix = `--${name}=`
    return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length)
}

function usage() {
    console.log('Usage: node scripts/generate-content-draft.js --spec=<file> --unit=<unit-id> --out=<file> [--reasoning=off|low|medium|xhigh] [--max-tokens=1600]')
}

async function main() {
    const specPath = argument('spec')
    const unitId = argument('unit')
    const outputPath = argument('out')
    const reasoningEffort = argument('reasoning') || 'off'
    const maxTokens = argument('max-tokens') ? Number(argument('max-tokens')) : undefined

    if (!specPath || !unitId || !outputPath) {
        usage()
        process.exitCode = 1
        return
    }

    if (!['off', 'low', 'medium', 'xhigh'].includes(reasoningEffort)) {
        throw new Error('--reasoning must be off, low, medium, or xhigh.')
    }
    if (maxTokens !== undefined && (!Number.isInteger(maxTokens) || maxTokens < 300 || maxTokens > 4000)) {
        throw new Error('--max-tokens must be an integer from 300 to 4000.')
    }

    const spec = JSON.parse(await readFile(resolve(specPath), 'utf8'))
    const unit = spec.units?.find((candidate) => candidate.id === unitId)
    if (!unit) throw new Error(`Unit not found in spec: ${unitId}`)

    const draft = await generateLessonDraft({ ...unit, source: spec.source }, { reasoningEffort, maxTokens })
    const destination = resolve(outputPath)
    await mkdir(dirname(destination), { recursive: true })
    await writeFile(destination, `${JSON.stringify(draft, null, 2)}\n`)

    console.log(`Draft created: ${destination}`)
    console.log('Status: draft only — no database records were created or published.')
}

main().catch((error) => {
    console.error(`Draft generation failed: ${error.message}`)
    process.exitCode = 1
})
