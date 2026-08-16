import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Local LLM configuration
const LLM_BASE_URL = process.env.LLM_API_URL || 'http://192.168.1.52:1234/v1';
const MODEL_NAME = process.env.LLM_MODEL || 'qwen3-coder-30b-a3b-instruct';

function normalizePrompt(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function promptSimilarity(a, b) {
    const aTokens = new Set(normalizePrompt(a).split(' ').filter(Boolean));
    const bTokens = new Set(normalizePrompt(b).split(' ').filter(Boolean));
    if (aTokens.size === 0 || bTokens.size === 0) return 0;

    let overlap = 0;
    for (const token of aTokens) {
        if (bTokens.has(token)) overlap++;
    }

    return overlap / Math.max(aTokens.size, bTokens.size);
}

function isDistinctEnough(candidatePrompt, existingPrompts) {
    return existingPrompts.every((prompt) => promptSimilarity(candidatePrompt, prompt) < 0.45);
}

// Life in UK topics based on the official handbook
const LIFE_IN_UK_TOPICS = [
    {
        id: 'life-uk-values',
        title: 'The Values and Principles of the UK',
        description: 'British values, democracy, rule of law, individual liberty'
    },
    {
        id: 'life-uk-geography',
        title: 'What is the UK?',
        description: 'Geography, climate, regions, population, languages'
    },
    {
        id: 'life-uk-history',
        title: 'A Long and Illustrious History',
        description: 'Key historical events, figures, and developments'
    },
    {
        id: 'life-uk-society',
        title: 'A Modern, Thriving Society',
        description: 'Education, healthcare, employment, welfare system'
    },
    {
        id: 'life-uk-government',
        title: 'The UK Government, the Law and Your Role',
        description: 'Government structure, voting, legal system, responsibilities'
    }
];

// Function to call local LLM
async function callLocalLLM(prompt, maxTokens = 2000) {
    try {
        const response = await fetch(`${LLM_BASE_URL.replace(/\/$/, '')}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: [
                    {
                        role: 'system',
                        content: 'Return strict JSON only. No markdown fences. No commentary. Use double quotes for all keys and string values. The answer must be a 0-based string index from 0 to 3.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: maxTokens,
                temperature: 0.2
            })
        });

        if (!response.ok) {
            throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error calling LLM:', error);
        throw error;
    }
}

function safeJsonArrayFromText(text) {
    if (!text || typeof text !== 'string') return [];

    try {
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        // Continue to extraction-based recovery.
    }

    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start === -1 || end === -1 || end <= start) return [];

    const candidate = text.slice(start, end + 1)
        .replace(/```json\s*/gi, '')
        .replace(/```/g, '')
        .replace(/,\s*([}\]])/g, '$1');

    try {
        const parsed = JSON.parse(candidate);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

// Generate questions for a specific topic
// Generate questions for a specific topic
async function generateQuestionsForTopic(topic, count = 20) {
    const allQuestions = [];
    const acceptedPrompts = [];
    const batchSize = 3; // Small batches are more reliable for local structured generation
    let batch = 0;

    console.log(`Generating ${count} questions for: ${topic.title} (batch size ${batchSize})`);

    while (allQuestions.length < count) {
        batch++;
        const remaining = count - allQuestions.length;
        const batchCount = Math.min(batchSize, remaining);
        console.log(`Batch ${batch}: Generating ${batchCount} questions (${remaining} remaining)...`);

        const avoidPromptBlock = acceptedPrompts.length > 0
            ? `\nAvoid generating questions that overlap with these existing prompts:\n${acceptedPrompts.map((prompt, index) => `${index + 1}. ${prompt}`).join('\n')}\n`
            : '';

        const prompt = `You are an expert on the Life in the UK test. Generate ${batchCount} multiple-choice questions about "${topic.title}: ${topic.description}" based on the official "Life in the United Kingdom: A Guide for New Residents" handbook.

Each question must:
1. Be factual and accurate
2. Have exactly 4 options (A, B, C, D)
3. Have one clearly correct answer
4. Include a brief explanation (2-3 sentences)
5. Be appropriate for citizenship test preparation
6. Cover different aspects of the topic
7. Do not repeat the same question idea or wording within the batch
8. Do not repeat the same question idea or wording from previously accepted questions

${avoidPromptBlock}

Format each question as a JSON object with these exact fields:
- prompt: "The question text?"
- options: ["Option 1", "Option 2", "Option 3", "Option 4"]
- answer: "0" (must be a 0-based string index: "0", "1", "2", or "3")
- explanation: "Brief explanation of why this is correct."
- difficulty: "easy", "medium", or "hard"

Return ONLY a valid JSON array of question objects. No additional text or formatting.
Use only double quotes.
Do not include trailing commas.
Do not prefix options with A), B), C), D).

Example:
[
  {
    "prompt": "What is the capital city of the United Kingdom?",
        "options": ["London", "Edinburgh", "Cardiff", "Belfast"],
        "answer": "0",
    "explanation": "London is the capital and largest city of the United Kingdom.",
    "difficulty": "easy"
  }
]`;

        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                const response = await callLocalLLM(prompt, Math.max(1800, batchCount * 450));
                console.log(`Batch ${batch + 1} LLM Response preview:`, response.substring(0, 200) + '...');

                // Try to parse the JSON response
                const questions = safeJsonArrayFromText(response);

                if (Array.isArray(questions) && questions.length > 0) {
                    // Validate each question
                    const validQuestions = questions.filter(q => {
                        const answerIndex = Number(q.answer)
                        return q.prompt &&
                               Array.isArray(q.options) &&
                               q.options.length === 4 &&
                               q.options.every(opt => typeof opt === 'string' && opt.trim().length > 0) &&
                               (q.answer === '0' || q.answer === '1' || q.answer === '2' || q.answer === '3' || Number.isInteger(answerIndex)) &&
                               answerIndex >= 0 && answerIndex < 4 &&
                               q.explanation &&
                               ['easy', 'medium', 'hard'].includes(q.difficulty);
                    }).filter((q) => isDistinctEnough(q.prompt, acceptedPrompts));

                    if (validQuestions.length > 0) {
                        validQuestions.forEach((q) => acceptedPrompts.push(q.prompt));
                        console.log(`Successfully generated ${validQuestions.length} valid questions in batch ${batch}`);
                        allQuestions.push(...validQuestions.slice(0, batchCount));
                        break; // Success, move to next batch
                    } else {
                        console.log('No valid distinct questions in response, trying again...');
                    }
                } else {
                    console.log('Response is not a valid array, trying again...');
                }
            } catch (error) {
                console.error(`Batch ${batch} attempt ${attempts + 1} failed:`, error.message);
            }

            attempts++;
            if (attempts < maxAttempts) {
                console.log(`Waiting 2 seconds before retry...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        if (attempts >= maxAttempts) {
            console.log(`Failed to generate questions for batch ${batch} after ${maxAttempts} attempts`);
            break;
        }

        // Small delay between batches
        if (allQuestions.length < count) {
            console.log('Waiting 1 second before next batch...');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    console.log(`Completed topic "${topic.title}": ${allQuestions.length} questions generated`);
    return allQuestions.slice(0, count);
}

// Main function to generate all questions
async function generateAllLifeInUKQuestions() {
    const allQuestions = [];

    for (const topic of LIFE_IN_UK_TOPICS) {
        console.log(`\n=== Generating questions for ${topic.title} ===`);

        const questions = await generateQuestionsForTopic(topic, 160); // Generate 160 questions per topic

        // Add topic information to each question
        const questionsWithTopic = questions.map(q => ({
            ...q,
            topicId: topic.id,
            topicTitle: topic.title,
            ukLevelId: 'entry-3', // Assuming Entry Level 3
            subject: 'life-in-uk',
            type: 'multiple-choice'
        }));

        allQuestions.push(...questionsWithTopic);

        // Save progress after each topic
        saveQuestionsToFile(allQuestions, 'life-in-uk-questions-progress.json');
    }

    // Final save
    saveQuestionsToFile(allQuestions, 'life-in-uk-questions-final.json');

    console.log(`\n=== Generation Complete ===`);
    console.log(`Total questions generated: ${allQuestions.length}`);
    console.log(`Questions per topic: ${allQuestions.length / LIFE_IN_UK_TOPICS.length}`);

    return allQuestions;
}

// Save questions to file
function saveQuestionsToFile(questions, filename) {
    const filePath = path.join(__dirname, '..', 'exports', filename);
    fs.writeFileSync(filePath, JSON.stringify(questions, null, 2));
    console.log(`Saved ${questions.length} questions to ${filename}`);
}

// Test LLM connection
async function testLLMConnection() {
    try {
        console.log('Testing LLM connection...');
        const response = await callLocalLLM('Say "Hello, LLM is working!" in exactly those words.');
        console.log('LLM Response:', response);
        return true;
    } catch (error) {
        console.error('LLM connection test failed:', error);
        return false;
    }
}

// Command line interface
const command = process.argv[2];

if (command === 'test') {
    testLLMConnection();
} else if (command === 'generate') {
    generateAllLifeInUKQuestions().catch(console.error);
} else if (command === 'topic') {
    const topicId = process.argv[3];
    const count = parseInt(process.argv[4]) || 5;
    const topic = LIFE_IN_UK_TOPICS.find(t => t.id === topicId);
    if (topic) {
        generateQuestionsForTopic(topic, count).then(questions => {
            // Add topic information to each question
            const questionsWithTopic = questions.map(q => ({
                ...q,
                topicId: topic.id,
                topicTitle: topic.title,
                ukLevelId: 'entry-3', // Assuming Entry Level 3
                subject: 'life-in-uk',
                type: 'multiple-choice'
            }));
            console.log(`Generated ${questions.length} questions for ${topic.title}`);
            saveQuestionsToFile(questionsWithTopic, `life-in-uk-${topicId}.json`);
        }).catch(console.error);
    } else {
        console.log('Topic not found. Available topics:');
        LIFE_IN_UK_TOPICS.forEach(t => console.log(`- ${t.id}: ${t.title}`));
    }
} else {
    console.log('Usage:');
    console.log('  node generate-life-in-uk-questions.js test          # Test LLM connection');
    console.log('  node generate-life-in-uk-questions.js generate      # Generate all questions');
    console.log('  node generate-life-in-uk-questions.js topic <id>    # Generate questions for specific topic');
    console.log('\nAvailable topics:');
    LIFE_IN_UK_TOPICS.forEach(t => console.log(`- ${t.id}: ${t.title}`));
}