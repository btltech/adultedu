import React, { useState } from 'react';

// Simple check/x icons for internal use
const CheckIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
)
const XIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
)

export default function MultiStepQuestion({ question, onAnswer, showResult, result }) {
    // Parse steps from assets
    // Expected structure: { steps: [{ prompt, options, answer, explanation }, ...] }
    let steps = [];
    try {
        if (question.assets) {
            const assets = typeof question.assets === 'string' ? JSON.parse(question.assets) : question.assets;
            steps = assets.steps || [];
        }
    } catch (e) {
        console.warn('Failed to parse multi-step assets:', e);
    }

    const [currentStep, setCurrentStep] = useState(0);
    const [stepAnswers, setStepAnswers] = useState({}); // { stepIndex: answer }
    const [stepResults, setStepResults] = useState({}); // { stepIndex: { isCorrect, explanation } }

    // For the currently active step
    const [selectedOption, setSelectedOption] = useState(null);

    // If no steps found, fallback to standard display (should be handled by parent, but safety first)
    if (steps.length === 0) {
        return <div className="text-red-400">Error: Invalid multi-step configuration.</div>;
    }

    const activeStep = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;

    // Handle submitting a sub-step
    const handleStepSubmit = () => {
        const answer = activeStep.options[selectedOption];

        // Local validation for sub-steps (we don't hit API until final step usually, 
        // OR we could hit API for every step. 
        // For "Practice" mode, typically we validate locally if we have the answer, 
        // but our API structure expects one final submit.
        // Let's assume we validate locally against `activeStep.answer` for intermediate steps.

        // Warning: `activeStep.answer` might be index or string. Let's assume index for robustness if options provided.
        // If answer is string "A", mapping is hard. Let's assume answer is the correct string or index.
        // Let's standardize on: answer is the CORRECT STRING in the assets JSON.

        const isCorrect = answer === activeStep.answer;

        setStepResults(prev => ({
            ...prev,
            [currentStep]: {
                isCorrect,
                explanation: activeStep.explanation
            }
        }));

        setStepAnswers(prev => ({
            ...prev,
            [currentStep]: answer
        }));

        if (isCorrect) {
            // Auto-advance after small delay if not last step
            if (!isLastStep) {
                setTimeout(() => {
                    setCurrentStep(prev => prev + 1);
                    setSelectedOption(null);
                }, 1500);
            } else {
                // Final step correct! Submit to parent to record progress
                // We pass "Correct" or the full chain of answers? 
                // Parent expects a single answer string usually. 
                // Let's pass "Completed" or the final answer.
                onAnswer("Completed");
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="glass-card p-4 flex items-center justify-between mb-2">
                <span className="badge badge-primary">
                    Scaffolded Problem • Level {question.ukLevel}
                </span>
                <span className="text-dark-400 text-sm">
                    Step {currentStep + 1} of {steps.length}
                </span>
            </div>

            {/* Main Prompt (Scenario) */}
            <div className="glass-card p-6 border-l-4 border-primary-500">
                <p className="text-lg text-dark-100 leading-relaxed">{question.prompt}</p>
                {question.imageUrl && (
                    <div className="mt-4 rounded-xl overflow-hidden bg-dark-900/50 border border-dark-700 flex justify-center p-4">
                        <img
                            src={question.imageUrl}
                            alt="Main Scenario"
                            className="max-h-64 object-contain rounded-lg shadow-lg"
                        />
                    </div>
                )}
            </div>

            {/* Steps History (Completed Steps) */}
            {steps.map((step, index) => {
                if (index > currentStep) return null; // Future steps hidden

                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                const result = stepResults[index];

                return (
                    <div
                        key={index}
                        className={`transition-all duration-500 ${isCurrent ? 'opacity-100 scale-100' : 'opacity-70 grayscale'
                            }`}
                    >
                        <div className="glass-card p-6">
                            <h3 className="text-sm font-bold text-dark-400 mb-2 uppercase tracking-wide">
                                Step {index + 1}
                            </h3>
                            <p className="text-md text-dark-200 mb-4">{step.prompt}</p>

                            {/* Options */}
                            <div className="space-y-2">
                                {step.options.map((opt, optIdx) => {
                                    const isSelected = isCurrent ? selectedOption === optIdx : stepAnswers[index] === opt;
                                    const isStepCorrect = result?.isCorrect;

                                    // Visual state
                                    let baseClass = "w-full text-left p-3 rounded-lg border text-sm transition-all ";
                                    if (isCompleted) {
                                        // History view
                                        if (isSelected) {
                                            baseClass += "bg-accent-500/20 border-accent-500 text-accent-300";
                                        } else {
                                            baseClass += "bg-dark-800 border-transparent text-dark-500";
                                        }
                                    } else {
                                        // Active view
                                        if (result) {
                                            // Result shown
                                            if (isSelected && isStepCorrect) baseClass += "bg-accent-500/20 border-accent-500 text-accent-300";
                                            else if (isSelected && !isStepCorrect) baseClass += "bg-red-500/20 border-red-500 text-red-300";
                                            else baseClass += "bg-dark-800 border-dark-700 text-dark-400 opacity-50";
                                        } else {
                                            // Selection mode
                                            if (isSelected) baseClass += "bg-primary-500/20 border-primary-500 text-primary-300";
                                            else baseClass += "bg-dark-800 border-dark-600 text-dark-300 hover:border-dark-500";
                                        }
                                    }

                                    return (
                                        <button
                                            key={optIdx}
                                            onClick={() => !result && isCurrent && setSelectedOption(optIdx)}
                                            disabled={!isCurrent || !!result}
                                            className={baseClass}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-6 h-6 rounded flex items-center justify-center text-xs ${isSelected ? 'bg-current/20' : 'bg-dark-700'}`}>
                                                    {String.fromCharCode(65 + optIdx)}
                                                </div>
                                                <span>{opt}</span>
                                                {result && isSelected && isStepCorrect && <CheckIcon />}
                                                {result && isSelected && !isStepCorrect && <XIcon />}
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Feedback */}
                            {result && (
                                <div className={`mt-4 p-3 rounded-lg text-sm ${result.isCorrect ? 'bg-accent-500/10 text-accent-300' : 'bg-red-500/10 text-red-300'
                                    }`}>
                                    <p className="font-bold mb-1">{result.isCorrect ? 'Correct!' : 'Try Again'}</p>
                                    <p className="opacity-90">{result.explanation}</p>

                                    {!result.isCorrect && (
                                        <button
                                            onClick={() => setStepResults(prev => {
                                                const newRes = { ...prev };
                                                delete newRes[index];
                                                return newRes;
                                            })}
                                            className="mt-2 text-xs underline hover:text-white"
                                        >
                                            Retry Step
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Submit Button for Current Step */}
                            {isCurrent && !result && (
                                <button
                                    onClick={handleStepSubmit}
                                    disabled={selectedOption === null}
                                    className="mt-4 btn-primary w-full justify-center py-2"
                                >
                                    Check Step
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
