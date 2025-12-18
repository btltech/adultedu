
import fs from 'fs/promises';
import path from 'path';

// Configuration
const LLM_API_URL = process.env.LLM_API_URL || 'http://127.0.0.1:1234/v1';
const MODEL_NAME = process.env.LLM_MODEL || 'openai/gpt-oss-20b:2';
const OUTPUT_FILE = path.join(process.cwd(), '../frontend/src/data/generated-levels.json');

console.log(`🔌 Connecting to LLM: ${LLM_API_URL}`);

async function generateCompletion(system, user) {
    try {
        const response = await fetch(`${LLM_API_URL}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: [
                    { role: 'system', content: system },
                    { role: 'user', content: user }
                ],
                temperature: 0.7,
            })
        });

        if (!response.ok) throw new Error(`LLM API Error: ${response.statusText}`);
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('LLM Request Failed:', error.message);
        return null;
    }
}

async function safeParseJSON(content) {
    try {
        let clean = content.replace(/```json\n?|\n?```/g, '').trim();
        clean = clean.replace(/,(\s*[}\]])/g, '$1'); // Fix trailing commas
        return JSON.parse(clean);
    } catch (e) {
        console.error("❌ JSON Parse Error:", e.message);
        return null;
    }
}

async function generateBatch(type, offset, count) {
    if (type === 'graph') {
        const system = `You are a math curriculum designer.
Generate ${count} linear equation challenges (Slope-Intercept).
Range: -10 to 10.
Start ID at ${offset + 1}.
Output JSON array ONLY.
Use DECIMALS, not fractions.`;
        const user = `Generate ${count} distinct levels for a "Graph Plotting Game".
Format: [{"id": ${offset + 1}, "title": "Name", "slope": 1.5, "intercept": -2, "difficulty": "Medium"}]`;
        const content = await generateCompletion(system, user);
        return content ? await safeParseJSON(content) : [];
    }

    if (type === 'logic') {
        const system = `You are a Computer Science teacher.
Generate ${count} Logic Gate puzzles.
Gates: AND, OR, XOR, NAND.
Start ID at ${offset + 1}.
Output JSON array ONLY.`;
        const user = `Generate ${count} levels for a "Circuit Breaker" game.
Format: [{"id": ${offset + 1}, "title": "Name", "gate": "XOR", "targetOutput": true, "lockedInputs": ["A"], "difficulty": "Hard"}]`;
        const content = await generateCompletion(system, user);
        return content ? await safeParseJSON(content) : [];
    }
    return [];
}

// ... imports and helpers ...

async function main() {
    console.log('🚀 Starting SUPPLEMENTAL Lab Population (+500 Levels)...');

    let fullData = { graphChallenges: [], logicPuzzles: [] };

    // 1. Load Existing Data
    try {
        const fileContent = await fs.readFile(OUTPUT_FILE, 'utf-8');
        fullData = JSON.parse(fileContent);
        console.log(`✅ Loaded existing data:`);
        console.log(`   - Graph: ${fullData.graphChallenges.length}`);
        console.log(`   - Logic: ${fullData.logicPuzzles.length}`);
    } catch (e) {
        console.log(`⚠️ No existing data found, starting fresh.`);
    }

    const TARGET_ADDITIONAL = 500;
    // We lean heavily on Graph for volume as it's infinite math
    const GRAPH_TARGET_TOTAL = fullData.graphChallenges.length + 400;
    const LOGIC_TARGET_TOTAL = fullData.logicPuzzles.length + 100;

    const BATCH_SIZE = 20;

    // --- Deduplication Helpers ---
    const getGraphKeys = (list) => new Set(list.map(l => `${l.slope}:${l.intercept}`));
    const getLogicKeys = (list) => new Set(list.map(l => `${l.gate}:${l.targetOutput}:${l.lockedInputs.sort().join(',')}`));

    let existingGraphKeys = getGraphKeys(fullData.graphChallenges);
    let existingLogicKeys = getLogicKeys(fullData.logicPuzzles);

    // 2. Generate MORE Graph Challenges
    console.log(`\n📈 expanding Graph Challenges to ${GRAPH_TARGET_TOTAL}...`);
    while (fullData.graphChallenges.length < GRAPH_TARGET_TOTAL) {
        process.stdout.write(`   Batch ${fullData.graphChallenges.length}/${GRAPH_TARGET_TOTAL}... `);
        const batch = await generateBatch('graph', fullData.graphChallenges.length, BATCH_SIZE);

        let added = 0;
        if (batch && batch.length > 0) {
            batch.forEach(item => {
                const key = `${item.slope}:${item.intercept}`;
                if (!existingGraphKeys.has(key)) {
                    // Update ID to be sequential properly
                    item.id = fullData.graphChallenges.length + 1;
                    fullData.graphChallenges.push(item);
                    existingGraphKeys.add(key);
                    added++;
                }
            });
            console.log(added > 0 ? `✅ (+${added} new unique)` : `⚠️ (All dupes skipped)`);
        } else {
            console.log(`❌ (Retry)`);
        }
    }

    // 3. Generate MORE Logic Puzzles
    console.log(`\n🔌 expanding Logic Puzzles to ${LOGIC_TARGET_TOTAL}...`);
    while (fullData.logicPuzzles.length < LOGIC_TARGET_TOTAL) {
        process.stdout.write(`   Batch ${fullData.logicPuzzles.length}/${LOGIC_TARGET_TOTAL}... `);
        const batch = await generateBatch('logic', fullData.logicPuzzles.length, BATCH_SIZE);

        let added = 0;
        if (batch && batch.length > 0) {
            batch.forEach(item => {
                // Logic is trickier to be "unique", so we allow same structure if Title is different?
                // Or just enforce structure uniqueness.
                // Let's enforce structure uniqueness but allow "Soft Rejects" if we run out of entropy
                // Actually for 250 existing, hitting 100 NEW unique structures is hard.
                // We will relax dedupe to: Gate + Target must be unique PER difficulty? 
                // Let's rely on strict KEY check first.
                const key = `${item.gate}:${item.targetOutput}:${item.lockedInputs.sort().join(',')}`;

                // Note: Logic uniqueness is hard with 2 inputs. Let's create more varieties.
                // If we get stuck (looped 5 times with 0 adds), we break.
                if (!existingLogicKeys.has(key)) {
                    item.id = fullData.logicPuzzles.length + 1;
                    fullData.logicPuzzles.push(item);
                    existingLogicKeys.add(key);
                    added++;
                }
            });
            console.log(added > 0 ? `✅ (+${added} new unique)` : `⚠️ (All dupes skipped)`);

            // Escape hatch: if we are stuck at same count for too long, just stop Logic generation
            if (added === 0 && fullData.logicPuzzles.length > 250) {
                console.log("   ⚠️ Starturated valid logic puzzles. Stopping early.");
                break;
            }
        } else {
            console.log(`❌ (Retry)`);
        }
    }

    // Save
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(fullData, null, 2));

    console.log(`\n✨ Successfully Expanded Lab Content!`);
    console.log(`   - Total Graph Levels: ${fullData.graphChallenges.length}`);
    console.log(`   - Total Logic Levels: ${fullData.logicPuzzles.length}`);
    console.log(`   Saved to: ${OUTPUT_FILE}`);
}

main();
