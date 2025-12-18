
import { PrismaClient } from '@prisma/client';
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
        return null; // Fallback handled by caller or retry
    }
}

async function main() {
    console.log('🚀 Generating 10 Unique Graph Challenges...');

    const systemPrompt = `You are a math curriculum designer. 
    Generate a JSON array of 10 linear equation challenges.
    Start easy (integer slopes) and get harder (fractions, negatives).
    
    Output Format:
    [
      { "id": 1, "title": "Level Name", "slope": 1, "intercept": 0, "difficulty": "Easy" }
    ]
    
    IMPORTANT: 
    - Return ONLY valid JSON. 
    - Use DECIMALS for non-integers (e.g. 0.33 not 1/3).
    - No markdown. No comments.`;

    const userPrompt = `Generate 10 distinct levels for a "Graph Plotting Game". 
    Range for slope/intercept is -10 to 10.
    Level 1 should be "y = x".
    Level 10 should be complex (e.g. fractional slope).`;

    const content = await generateCompletion(systemPrompt, userPrompt);

    if (!content) {
        console.error("❌ Failed to get response from LLM.");
        return;
    }

    try {
        let clean = content.replace(/```json\n?|\n?```/g, '').trim();
        // Fix potential trailing commas
        clean = clean.replace(/,(\s*[}\]])/g, '$1');

        const levels = JSON.parse(clean);

        // Ensure directory exists
        await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });

        // Save to frontend data file
        await fs.writeFile(OUTPUT_FILE, JSON.stringify({ graphChallenges: levels }, null, 2));

        console.log(`\n✅ Successfully generated ${levels.length} levels!`);
        console.log(`   Saved to: ${OUTPUT_FILE}`);

        // Preview
        levels.forEach(l => {
            console.log(`   - [${l.difficulty}] ${l.title}: y = ${l.slope}x + ${l.intercept}`);
        });

    } catch (e) {
        console.error("❌ Failed to parse/save JSON:", e.message);
        console.log("Raw Output:", content);
    }
}

main();
