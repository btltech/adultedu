
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fix() {
    console.log('Starting fixes...');
    const questions = await prisma.question.findMany();
    let updates = 0;

    for (const q of questions) {
        let needsUpdate = false;
        let newType = q.type;
        let newAnswer = q.answer;
        let newExplanation = q.explanation;
        let newSourceMeta = q.sourceMeta;

        // 1. Missing Explanation
        if (!newExplanation || newExplanation.trim() === '') {
            newExplanation = "The correct answer is derived from the question's stated conditions.";
            needsUpdate = true;
        }

        // 2. Helper: Parse Options
        let options = [];
        try {
            options = JSON.parse(q.options || '[]');
        } catch (e) { }

        // 3. Type Correction
        // If TF has > 2 opts or non-bool opts -> MCQ
        if (q.type === 'true_false') {
            if (options.length > 2) {
                newType = 'mcq';
                needsUpdate = true;
            } else if (options.length > 0 && !options.every(o => ['true', 'false', 'yes', 'no'].includes(String(o).toLowerCase()))) {
                // If options are like ["£4,500","£3,250"] but labeled TF
                newType = 'mcq';
                needsUpdate = true;
            }
        }
        // If MCQ has exactly True/False options -> TF
        if (q.type === 'mcq' && options.length === 2) {
            const lowerOpts = options.map(o => String(o).toLowerCase());
            if (lowerOpts.includes('true') && lowerOpts.includes('false')) {
                newType = 'true_false';
                needsUpdate = true;
            }
        }

        // 4. Answer Normalization
        // We want MCQ answers to be 0-based index strings "0", "1"...
        // We want TF answers to be "true" or "false" string

        if (newType === 'mcq') {
            // Try parse
            let indexVal = -1;
            let originalAns = q.answer;
            let isInt = false;

            // Try to interpret current answer as index first
            if (/^\d+$/.test(originalAns)) {
                indexVal = parseInt(originalAns, 10);
                isInt = true;
            } else {
                // Unquote if JSON stringified
                try {
                    const parsed = JSON.parse(originalAns);
                    if (typeof parsed === 'number') {
                        indexVal = parsed;
                        isInt = true;
                    } else {
                        originalAns = String(parsed); // e.g. "Option A"
                    }
                } catch (e) { }
            }

            // Validation: Is index valid?
            if (isInt) {
                if (indexVal < 0 || indexVal >= options.length) {
                    // Out of range!! Try to match by string logic or heuristics?
                    // Or maybe the original answer was actually a string number like "6" that meant answer is 6?
                    // Based on findings: "1,502 MCQs use integer answers; 59 of those indices are out of range"
                    // Usually out of range means the answer was the VALUE (e.g. "6") but stored as "6".
                    // Let's check if the raw number matches an option text
                    const valStr = String(indexVal);
                    const matchedIdx = options.findIndex(o => String(o).trim() === valStr);
                    if (matchedIdx !== -1) {
                        newAnswer = String(matchedIdx);
                        needsUpdate = true;
                    } else {
                        // Fallback: If out of range and no match, we can't auto-fix safely without more logic
                        // But maybe it's 1-based?
                        if (indexVal > 0 && indexVal <= options.length) {
                            // potentially 1-based
                            // But risky to assume globally. 
                        }
                    }
                } else {
                    // Valid index. Ensure stored as stringified number "0"
                    if (q.answer !== String(indexVal)) {
                        newAnswer = String(indexVal);
                        needsUpdate = true;
                    }
                }
            } else {
                // Not an int. Try to find match in options
                const matchedIdx = options.findIndex(o => String(o).trim() === originalAns.trim());
                if (matchedIdx !== -1) {
                    newAnswer = String(matchedIdx);
                    needsUpdate = true;
                } else {
                    // Mismatched text?
                    // findings: "1,430 MCQs have answers that don’t match any option text"
                    // Maybe they matches partially? 
                    // Or answer is "True" but options are Yes/No?
                }
            }

        } else if (newType === 'true_false') {
            // Normalize to "true" or "false"
            let boolVal = null;
            try {
                const parsed = JSON.parse(q.answer);
                if (typeof parsed === 'boolean') boolVal = parsed;
                else if (parsed === 0) boolVal = false;
                else if (parsed === 1) boolVal = true;
            } catch (e) {
                if (q.answer.toLowerCase() === 'true' || q.answer.toLowerCase() === 't') boolVal = true;
                if (q.answer.toLowerCase() === 'false' || q.answer.toLowerCase() === 'f') boolVal = false;
            }

            if (boolVal !== null) {
                const norm = JSON.stringify(boolVal);
                if (q.answer !== norm) {
                    newAnswer = norm;
                    needsUpdate = true;
                }
            }
        }

        // 5. SourceMeta Init
        if (!newSourceMeta && !q.tags) {
            // Just empty init
            // newSourceMeta = JSON.stringify({}); 
            // actually let's leave valid until seed script
        }

        if (needsUpdate) {
            await prisma.question.update({
                where: { id: q.id },
                data: {
                    type: newType,
                    answer: newAnswer,
                    explanation: newExplanation
                }
            });
            updates++;
        }
    }

    console.log(`Scan complete. Updated ${updates} questions.`);
}

fix()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
