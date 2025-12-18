
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function audit() {
    console.log('Starting audit...');
    const questions = await prisma.question.findMany();

    const stats = {
        total: questions.length,
        types: {},
        missingMeta: 0,
        missingExplanation: 0,
        mcq: {
            total: 0,
            badOptionsJSON: 0,
            twoOptions: 0,
            integerAnswers: 0,
            outOfRangeIndices: 0,
            nonJsonAnswers: 0,
            stringMismatch: 0, // Answer is a string but not in options
        },
        tf: {
            total: 0,
            badAnswerJSON: 0,
            invalidValue: 0, // Not true/false/0/1
        },
        short: {
            total: 0,
        }
    };

    const findings = {
        outOfRangeIds: [],
        mismatchedIds: [],
        tfInvalidIds: [],
        missingExplIds: []
    };

    for (const q of questions) {
        // Type counts
        stats.types[q.type] = (stats.types[q.type] || 0) + 1;

        // Meta check
        if (!q.tags && !q.sourceMeta) stats.missingMeta++;
        if (!q.explanation || q.explanation.trim() === '') {
            stats.missingExplanation++;
            findings.missingExplIds.push(q.id);
        }

        if (q.type === 'mcq') {
            stats.mcq.total++;
            let options = [];
            try {
                options = JSON.parse(q.options || '[]');
                if (options.length === 2) stats.mcq.twoOptions++;
            } catch (e) {
                stats.mcq.badOptionsJSON++;
                continue;
            }

            let answer;
            let isJson = true;
            try {
                answer = JSON.parse(q.answer);
            } catch (e) {
                isJson = false;
                stats.mcq.nonJsonAnswers++;
                answer = q.answer; // Treat as raw string
            }

            // Check if integer/index
            if (Number.isInteger(answer) || (typeof answer === 'string' && /^\d+$/.test(answer))) {
                const idx = parseInt(answer, 10);
                stats.mcq.integerAnswers++;
                if (idx < 0 || idx >= options.length) {
                    stats.mcq.outOfRangeIndices++;
                    findings.outOfRangeIds.push(q.id);
                }
            } else {
                // String match check
                // If answer is an array (multi-select), check all
                // If answer is single string
                const ansStr = String(answer).trim();
                // We assume single answer for this simplified check or array
                if (!options.includes(ansStr)) {
                    // strict match fail
                    stats.mcq.stringMismatch++;
                    findings.mismatchedIds.push(q.id);
                }
            }
        } else if (q.type === 'true_false') {
            stats.tf.total++;
            let answer;
            try {
                answer = JSON.parse(q.answer);
            } catch (e) {
                stats.tf.badAnswerJSON++;
                answer = q.answer;
            }

            if (typeof answer !== 'boolean' && answer !== 0 && answer !== 1) {
                stats.tf.invalidValue++;
                findings.tfInvalidIds.push(q.id);
            }
        } else if (q.type === 'short_answer') {
            stats.short.total++;
        }
    }

    console.log(JSON.stringify(stats, null, 2));
    console.log('Sample OutOfRange IDs:', findings.outOfRangeIds.slice(0, 5));
    console.log('Sample Mismatched IDs:', findings.mismatchedIds.slice(0, 5));
    console.log('Sample TF Invalid IDs:', findings.tfInvalidIds.slice(0, 5));
    console.log('Sample Missing Expl IDs:', findings.missingExplIds);
}

audit()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
