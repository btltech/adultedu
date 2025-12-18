
import { PrismaClient } from '@prisma/client';
import { parseArgs } from 'util';

const prisma = new PrismaClient();

const LLM_URL = process.env.LLM_URL || 'http://192.168.0.165:1234';
const LLM_MODEL = process.env.LLM_MODEL || 'qwen3-coder-30b-a3b-instruct-mlx';

// Parse args
// node generate-targeted.js --track <slug> --level <E1|E2|L1|L2> --type <mcq|scenario> --count <N>
const args = process.argv.slice(2);
const getArg = (key) => {
    const idx = args.indexOf(`--${key}`);
    return idx !== -1 ? args[idx + 1] : null;
};

const TRACK_SLUG = getArg('track');
const LEVEL_CODE = getArg('level') || 'L2';
const TYPE = getArg('type') || 'mcq';
const COUNT = parseInt(getArg('count') || '5', 10);

if (!TRACK_SLUG) {
    console.error("Usage: node generate-targeted.js --track <slug> [--level <E1|E2|L2>] [--type <mcq|scenario>] [--count <N>]");
    process.exit(1);
}

async function callLLM(prompt) {
    try {
        const response = await fetch(`${LLM_URL}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: LLM_MODEL,
                messages: [
                    { role: 'system', content: 'You are an expert UK educational content creator. Output strictly valid JSON arrays.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 8000
            })
        });

        if (!response.ok) throw new Error(`LLM Error: ${response.status}`);
        const data = await response.json();
        let content = data.choices[0]?.message?.content || '[]';

        // Clean markdown
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(content);
    } catch (e) {
        console.error("LLM Generation Failed:", e.message);
        return [];
    }
}

async function main() {
    // 1. Resolve Track & Level
    const track = await prisma.track.findUnique({ where: { slug: TRACK_SLUG }, include: { topics: true } });
    if (!track) {
        console.error("Track not found");
        process.exit(1);
    }

    // Attempt to find specific level object, or fallback to L2 for ID but keep requested level for prompt
    let levelObj = await prisma.ukLevel.findFirst({ where: { code: LEVEL_CODE } });
    if (!levelObj) {
        console.log(`Level ${LEVEL_CODE} not found in DB, falling back to L2 for DB relation, but content will be ${LEVEL_CODE}.`);
        levelObj = await prisma.ukLevel.findFirst({ where: { code: 'L2' } });
    }

    // Pick a topic (random or first)
    const topic = track.topics[0];
    if (!topic) {
        console.error("No topics in track");
        process.exit(1);
    }

    console.log(`Generating ${COUNT} ${TYPE} items for ${track.title} @ ${LEVEL_CODE} (Topic: ${topic.title})...`);

    // 2. Build Prompt
    let promptText = "";

    if (TYPE === 'scenario') {
        promptText = `Generate ${COUNT} SCENARIO-BASED questions for UK Level ${LEVEL_CODE} students.
Topic: ${topic.title}.
Format: JSON Array.
Each item must have:
- type: "scenario"
- prompt: A multi-sentence realistic scenario (e.g. workplace, home budget) followed by a question.
- options: ["A", "B", "C", "D"] (4 distinct plausible answers)
- answer: "0", "1", "2", or "3" (Index of correct answer)
- explanation: Detailed step-by-step logic.
- difficulty: 4
- sourceMeta: { "style": "case_study", "skills": ["..."] }

Ensure the math/logic is robust. Money in £.
`;
    } else if (TYPE === 'multi_step') {
        promptText = `Generate ${COUNT} MULTI-STEP problems for UK Level ${LEVEL_CODE} (High Demand).
Topic: ${topic.title}.
Format: JSON Array.
Each item must have:
- type: "multi_step"
- prompt: A complex problem requiring at least 2 distinct calculation steps.
- answer: A JSON array of strings representing the steps, e.g. ["Step 1 result...", "Step 2 result...", "Final Answer"]. OR if you prefer MCQ format for auto-marking, provide options and answer index, but label type as "multi_step". 
*For this system, we will use MCQ format for auto-marking but with 'multi_step' type.*
- options: 4 distinct choices.
- answer: "0", "1", "2", or "3".
- explanation: Clearly break down the steps (Step 1, Step 2, Conclusion).
- difficulty: 5

Example:
{"prompt":"...", "options":["..."], "answer":"1", "explanation":"Step 1: ... Step 2: ...", "difficulty":5, "type":"multi_step"}
`;
    } else {
        // MCQ (default)
        promptText = `Generate ${COUNT} MCQ questions for UK Level ${LEVEL_CODE} students.
Target Audience: Adults returning to education.
Topic: ${topic.title}.
Level Specifics:
${LEVEL_CODE === 'E1' || LEVEL_CODE === 'E2' ? '- Very simple language.\n- Focus on basics (recognition, simple count, basic definitions).' : '- Standard GCSE rigor.'}

Format: JSON Array.
Each item must have:
- type: "mcq"
- prompt: clear question.
- options: 4 distinct choices.
- answer: "0", "1", "2", or "3" (index).
- explanation: Clear reason.
- difficulty: ${LEVEL_CODE.startsWith('E') ? 1 : 3}

Example JSON:
[{"prompt":"...", "options":["..."], "answer":"0", "explanation":"...", "difficulty":1}]
`;
    }

    // 3. Generate Iteratively
    console.log(`Generating ${COUNT} items iteratively...`);
    let saved = 0;

    // We break it down to batch size 1 to ensure valid JSON every time
    // The prompt asks for Array, but local LLM fails on large Arrays.
    // Changing prompt to ask for 1 item at a time is safer.

    // Adjust prompt for single item
    promptText = promptText.replace(`Generate ${COUNT}`, "Generate 1").replace("Format: JSON Array", "Format: JSON Object (Single Item)");

    for (let i = 0; i < COUNT; i++) {
        process.stdout.write(`   Item ${i + 1}/${COUNT}... `);
        try {
            const result = await callLLM(promptText);
            // Result might be object or array of 1
            let item = Array.isArray(result) ? result[0] : result;

            if (!item || !item.prompt || !item.options) {
                console.log("❌ Invalid");
                continue;
            }

            let ansStr = String(item.answer);
            await prisma.question.create({
                data: {
                    topicId: topic.id,
                    ukLevelId: levelObj.id,
                    type: TYPE,
                    prompt: item.prompt,
                    options: JSON.stringify(item.options),
                    answer: ansStr,
                    explanation: item.explanation || "Correct answer.",
                    difficulty: item.difficulty || 4,
                    sourceMeta: item.sourceMeta ? JSON.stringify(item.sourceMeta) : undefined,
                    isPublished: true
                }
            });
            console.log("✅ Saved");
            saved++;
        } catch (e) {
            console.log("❌ Error: " + e.message);
        }
    }

    console.log(`Successfully saved ${saved}/${COUNT} items.`);
}

// Removing the verify step inside main, just rely on loop logs
// main().finally(...) moved below


main().finally(() => prisma.$disconnect());
