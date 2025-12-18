
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, '../../frontend/src/data/generated-levels.json');

try {
    console.log(`🔍 Auditing file: ${DATA_FILE}`);
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

    // 1. Verify Graphs
    const graphs = data.graphChallenges || [];
    const graphKeys = new Set();
    const graphDupes = [];

    graphs.forEach(g => {
        const key = `${g.slope}:${g.intercept}`;
        if (graphKeys.has(key)) {
            graphDupes.push(g);
        } else {
            graphKeys.add(key);
        }
    });

    // 2. Verify Logic
    const logic = data.logicPuzzles || [];
    const logicKeys = new Set();
    const logicDupes = [];

    logic.forEach(l => {
        // Normalize locked inputs for fair comparison
        const inputs = Array.isArray(l.lockedInputs) ? l.lockedInputs.sort().join(',') : '';
        const key = `${l.gate}:${l.targetOutput}:${inputs}`;
        if (logicKeys.has(key)) {
            logicDupes.push(l);
        } else {
            logicKeys.add(key);
        }
    });

    console.log('\n📊 Deduplication Report:');
    console.log('------------------------');
    console.log(`📈 Graph Levels: ${graphs.length}`);
    console.log(`   - Unique:     ${graphKeys.size}`);
    console.log(`   - Duplicates: ${graphDupes.length}`);

    console.log(`\n🔌 Logic Levels: ${logic.length}`);
    console.log(`   - Unique:     ${logicKeys.size}`);
    console.log(`   - Duplicates: ${logicDupes.length}`);

    if (graphDupes.length === 0 && logicDupes.length === 0) {
        console.log('\n✅ PASS: No duplicates found.');
    } else {
        console.log('\n❌ FAIL: Duplicates detected.');
    }

} catch (e) {
    console.error("Error reading file:", e.message);
}
