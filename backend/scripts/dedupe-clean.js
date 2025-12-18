
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, '../../frontend/src/data/generated-levels.json');

async function main() {
    console.log(`🧹 Cleaning duplicates from: ${DATA_FILE}`);

    const content = await fs.readFile(DATA_FILE, 'utf-8');
    const data = JSON.parse(content);

    // 1. Clean Graphs
    const uniqueGraphs = [];
    const graphKeys = new Set();

    data.graphChallenges.forEach(g => {
        const key = `${g.slope}:${g.intercept}`;
        if (!graphKeys.has(key)) {
            graphKeys.add(key);
            uniqueGraphs.push(g);
        }
    });

    // 2. Clean Logic
    const uniqueLogic = [];
    const logicKeys = new Set();

    data.logicPuzzles.forEach(l => {
        const inputs = Array.isArray(l.lockedInputs) ? l.lockedInputs.sort().join(',') : '';
        const key = `${l.gate}:${l.targetOutput}:${inputs}`;
        if (!logicKeys.has(key)) {
            logicKeys.add(key);
            uniqueLogic.push(l);
        }
    });

    // 3. Re-index IDs
    const cleanData = {
        graphChallenges: uniqueGraphs.map((g, i) => ({ ...g, id: i + 1 })),
        logicPuzzles: uniqueLogic.map((l, i) => ({ ...l, id: i + 1 }))
    };

    console.log(`\n📉 Reduction Report:`);
    console.log(`   Graphs: ${data.graphChallenges.length} -> ${cleanData.graphChallenges.length} (-${data.graphChallenges.length - cleanData.graphChallenges.length})`);
    console.log(`   Logic:  ${data.logicPuzzles.length} -> ${cleanData.logicPuzzles.length} (-${data.logicPuzzles.length - cleanData.logicPuzzles.length})`);

    await fs.writeFile(DATA_FILE, JSON.stringify(cleanData, null, 2));
    console.log(`\n✅ Saved cleaned file.`);
}

main();
