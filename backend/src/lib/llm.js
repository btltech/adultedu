/**
 * LLM Integration Client
 * Connects to local LM Studio instance
 */

const LM_STUDIO_URL = process.env.LLM_API_URL || 'http://127.0.0.1:1234/v1';
const MODEL_NAME = process.env.LLM_MODEL || 'openai/gpt-oss-20b:2';

export async function generateCompletion(prompt, systemPrompt = 'You are a helpful educational assistant.') {
    try {
        const response = await fetch(`${LM_STUDIO_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 2000,
            })
        });

        if (!response.ok) {
            throw new Error(`LLM API Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('LLM Generation Failed:', error);
        throw error;
    }
}

export async function generateJSON(prompt, systemPrompt) {
    // Force JSON response in the prompt if not supported by model directly
    const jsonPrompt = `${prompt}\n\nIMPORTANT: Respond ONLY with valid JSON. Do not include markdown formatting like \`\`\`json.`;

    const content = await generateCompletion(jsonPrompt, systemPrompt);

    try {
        // 1. naive cleanup of markdown
        let clean = content.replace(/```json\n?|\n?```/g, '').trim();

        // 2. heuristic: find first '[' and last ']'
        const firstBracket = clean.indexOf('[');
        const lastBracket = clean.lastIndexOf(']');

        if (firstBracket !== -1 && lastBracket !== -1) {
            clean = clean.substring(firstBracket, lastBracket + 1);
        }

        // 3. remove trailing commas (common LLM error)
        clean = clean.replace(/,\s*([\]}])/g, '$1');

        return JSON.parse(clean);
    } catch (e) {
        console.error('Failed to parse JSON response. Content chunk:', content.substring(0, 100) + '...');
        const error = new Error('Invalid JSON response from LLM');
        error.content = content;
        throw error;
    }
}
