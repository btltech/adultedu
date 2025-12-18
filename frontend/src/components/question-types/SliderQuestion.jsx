import React, { useState } from 'react';

export default function SliderQuestion({ question, onAnswer, showResult, result }) {
    // Parse config from question.options or generic defaults
    // Assuming config is passed in a standardized way or we infer defaults
    // For now, let's assume options stores [min, max, step, correctValue] if it's a number array?
    // OR more likely, options is still a list of distractors, but for a slider we need specific metadata.
    // Let's rely on `sourceMeta` or parse options.
    // Schema plan says: `slider` is just a type.

    // Simplification: Store slider config in `options` as a JSON string for [min, max, step, unit]
    // Example options: "[0, 180, 1, "degrees"]"

    let min = 0, max = 100, step = 1, unit = '';

    try {
        const raw = question.options
        const parsed =
            Array.isArray(raw)
                ? raw
                : typeof raw === 'string'
                    ? JSON.parse(raw)
                    : null

        if (Array.isArray(parsed)) {
            min = Number(parsed[0] ?? 0)
            max = Number(parsed[1] ?? 100)
            step = Number(parsed[2] ?? 1)
            unit = String(parsed[3] ?? '')
        }
    } catch (e) {
        console.warn('Failed to parse slider options:', e);
    }

    const [value, setValue] = useState(Math.floor((max - min) / 2) + min); // Start in middle

    const handleSubmit = () => {
        onAnswer(String(value));
    };

    return (
        <div className="glass-card p-6">
            <div className="mb-8">
                <span className="badge badge-purple mb-3">
                    Estimation • Level {question.ukLevel}
                </span>
                <p className="text-lg text-dark-100 leading-relaxed mb-4">{question.prompt}</p>
                {question.imageUrl && (
                    <div className="mb-6 rounded-xl overflow-hidden bg-dark-900/50 border border-dark-700 flex justify-center p-4">
                        <img
                            src={question.imageUrl}
                            alt="Question Diagram"
                            className="max-h-64 object-contain rounded-lg shadow-lg"
                        />
                    </div>
                )}
            </div>

            <div className="mb-8 px-4">
                <div className="flex justify-between text-dark-400 text-sm mb-2 font-mono">
                    <span>{min}{unit}</span>
                    <span className="text-primary-400 font-bold text-lg">{value}{unit}</span>
                    <span>{max}{unit}</span>
                </div>
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => !showResult && setValue(Number(e.target.value))}
                    disabled={showResult}
                    className="w-full h-3 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-primary-500 hover:accent-primary-400 transition-all"
                />
            </div>

            {/* Answer Checking / Result Display */}
            {showResult ? (
                <div className={`p-4 rounded-xl ${result?.isCorrect
                    ? 'bg-accent-500/10 border border-accent-500/30'
                    : 'bg-amber-500/10 border border-amber-500/30'
                    }`}>
                    <div className="flex items-center gap-2 mb-2">
                        {result?.isCorrect ? (
                            <span className="text-accent-400 font-medium">✓ Correct Estimate!</span>
                        ) : (
                            <div className="flex flex-col">
                                <span className="text-amber-400 font-medium mb-1">✗ Not quite</span>
                                <span className="text-dark-300 text-sm">
                                    Correct answer: {String(result?.correctAnswer ?? '').trim()}{unit}
                                </span>
                            </div>
                        )}
                    </div>
                    <p className="text-dark-300 text-sm mt-2 pt-2 border-t border-white/5">{result?.explanation}</p>
                </div>
            ) : (
                <button
                    onClick={handleSubmit}
                    className="btn-primary w-full justify-center"
                >
                    Submit Estimate
                </button>
            )}
        </div>
    );
}
