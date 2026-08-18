#!/usr/bin/env node
/**
 * CLI for the behavioural question audit. The analysis itself lives in
 * src/lib/questionSignals.js so the weekly scheduler and a manual run can
 * never disagree about what counts as a bad question.
 *
 * Usage:
 *   node scripts/audit-question-signals.js
 *   node scripts/audit-question-signals.js --min-attempts=30 --out=signals.json
 *   node scripts/audit-question-signals.js --flag
 *   node scripts/audit-question-signals.js --quarantine            # preview
 *   node scripts/audit-question-signals.js --quarantine --apply    # unpublish
 */
import { writeFile } from 'node:fs/promises'
import prisma from '../src/lib/db.js'
import { collectQuestionSignals, resolveSignalConfig, SIGNAL_DEFAULTS } from '../src/lib/questionSignals.js'

const FLAG_TO_CONFIG = {
    'min-attempts': 'minAttempts',
    'near-zero-success': 'nearZeroSuccess',
    'miskey-margin': 'miskeyMargin',
    'guessing-tolerance': 'guessingTolerance',
    'fast-wrong-seconds': 'fastWrongSeconds',
    'negative-discrimination': 'negativeDiscrimination',
    'min-rest-questions': 'minRestQuestions',
    'functioning-discrimination': 'functioningDiscrimination',
    'quarantine-high-signals': 'quarantineHighSignals',
    'max-quarantine': 'maxQuarantinePerRun',
}

function parseArgs(argv) {
    const args = new Map()
    for (const part of argv.slice(2)) {
        const [key, value] = part.replace(/^--/, '').split('=')
        args.set(key, value === undefined ? true : value)
    }
    return args
}

async function main() {
    const args = parseArgs(process.argv)

    const overrides = {}
    for (const [flag, key] of Object.entries(FLAG_TO_CONFIG)) {
        if (!args.has(flag)) continue
        const parsed = Number(args.get(flag))
        if (Number.isFinite(parsed)) overrides[key] = parsed
    }

    const result = await collectQuestionSignals({
        config: resolveSignalConfig(overrides),
        quarantine: args.get('quarantine') === true,
        flag: args.get('flag') === true,
        apply: args.get('apply') === true,
    })

    const { allFindings, ...summary } = result
    if (args.has('out')) await writeFile(String(args.get('out')), JSON.stringify(result, null, 2))
    console.log(JSON.stringify(args.has('verbose') ? result : summary, null, 2))
}

main()
    .catch((error) => { console.error(error.stack || error); process.exitCode = 1 })
    .finally(() => prisma.$disconnect())

export { SIGNAL_DEFAULTS }
