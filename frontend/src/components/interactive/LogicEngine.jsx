
import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function LogicEngine({ challenge, isChallenge = false, onCorrect }) {
    // Challenge format: { gate: 'AND', targetOutput: true, lockedInputs: ['A'] }

    const [inputs, setInputs] = useState({ A: false, B: false });
    const [gateType, setGateType] = useState('AND');
    const [feedback, setFeedback] = useState(null);

    // Initial Setup for Challenge
    useEffect(() => {
        if (isChallenge && challenge) {
            setGateType(challenge.gate || 'AND');
            setInputs({ A: false, B: false }); // Reset inputs
            setFeedback(null);
        }
    }, [challenge, isChallenge]);

    // Calculate Output
    let output = false;
    switch (gateType) {
        case 'AND': output = inputs.A && inputs.B; break;
        case 'OR': output = inputs.A || inputs.B; break;
        case 'XOR': output = inputs.A !== inputs.B; break;
        case 'NAND': output = !(inputs.A && inputs.B); break;
        default: break;
    }

    const toggle = (key) => {
        if (isChallenge && challenge?.lockedInputs?.includes(key)) return; // Prevent unlocking if locked
        setInputs(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const checkAnswer = () => {
        if (output === challenge.targetOutput) {
            setFeedback('correct');
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.8 } }); // Fireworks
            if (onCorrect) onCorrect();
        } else {
            setFeedback('incorrect');
            setTimeout(() => setFeedback(null), 2000);
        }
    };

    const colorOn = '#22c55e';
    const colorOff = '#ef4444';

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-dark-100 p-8 max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-dark-50 mb-1">
                        {isChallenge ? 'Logic Puzzle 🧩' : 'Logic Gate Simulator 🔌'}
                    </h2>
                    <p className="text-dark-400">
                        {isChallenge
                            ? `Mission: Make the output ${challenge.targetOutput ? 'ON' : 'OFF'}`
                            : 'Toggle inputs to explore logic gates.'}
                    </p>
                </div>
                {isChallenge && (
                    <div className="text-right">
                        {feedback === 'correct' && <span className="text-green-600 font-bold animate-bounce block">Unlocked! 🔓</span>}
                        {feedback === 'incorrect' && <span className="text-red-500 font-bold animate-pulse block">Locked 🔒</span>}
                    </div>
                )}
            </div>

            <div className="flex flex-col items-center gap-12">

                {/* Circuit Visualization */}
                <div className="relative w-full max-w-lg h-64 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between px-8">

                    {/* Inputs */}
                    <div className="space-y-16 flex flex-col">
                        {['A', 'B'].map((key) => {
                            const isLocked = isChallenge && challenge?.lockedInputs?.includes(key);
                            return (
                                <button
                                    key={key}
                                    onClick={() => toggle(key)}
                                    disabled={isLocked}
                                    className={`w-16 h-12 rounded-lg border-2 shadow-sm font-bold text-lg transition-all flex items-center justify-center relative z-10 
                                        ${inputs[key] ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700'}
                                        ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
                                    `}
                                >
                                    {inputs[key] ? '1' : '0'}
                                    {isLocked && <span className="absolute -top-3 -right-3 text-xs">🔒</span>}

                                    <div
                                        className="absolute left-full top-1/2 w-20 h-1 -z-10 transition-colors duration-300"
                                        style={{ backgroundColor: inputs[key] ? colorOn : colorOff }}
                                    />
                                </button>
                            );
                        })}
                    </div>

                    {/* The Gate */}
                    <div className="w-32 h-32 bg-white rounded-xl shadow-md border-2 border-dark-100 flex flex-col items-center justify-center relative z-20">
                        {/* If Challenge, Gate might be fixed or selectable. Implementing fixed for now for simplicity */}
                        <div className="font-bold text-xl text-dark-50 mb-2">{gateType}</div>

                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-dark-300">
                            {gateType === 'AND' && <path d="M6 5v14h6a7 7 0 0 0 0-14H6z" />}
                            {gateType === 'OR' && <path d="M5 5c5 0 8 2 11 7-3 5-6 7-11 7V5z" />}
                            {gateType === 'XOR' && <path d="M3 5c5 0 8 2 11 7-3 5-6 7-11 7V5z M16 12h2" />}
                            {gateType === 'NAND' && <g><path d="M6 5v14h6a7 7 0 0 0 0-14H6z" /><circle cx="18" cy="12" r="2" /></g>}
                        </svg>

                        <div
                            className="absolute left-full top-1/2 w-16 h-1 -z-10 transition-colors duration-300"
                            style={{ backgroundColor: output ? colorOn : colorOff }}
                        />
                    </div>

                    {/* Output Bulb */}
                    <div className="flex flex-col items-center">
                        <div className={`w-16 h-16 rounded-full shadow-lg border-4 transition-all duration-500 flex items-center justify-center mb-2 ${output ? 'bg-yellow-400 border-yellow-200 shadow-yellow-200/50' : 'bg-gray-300 border-gray-400'}`}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill={output ? "white" : "gray"} stroke="none">
                                <path d="M9 21h6v-2H9v2zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
                            </svg>
                        </div>
                        <span className={`font-bold text-xl ${output ? 'text-green-600' : 'text-red-600'}`}>
                            {output ? 'ON' : 'OFF'}
                        </span>
                    </div>

                </div>

                {isChallenge && (
                    <button
                        onClick={checkAnswer}
                        className="w-full max-w-lg py-3 bg-dark-50 text-white font-bold rounded-xl shadow-lg hover:bg-dark-100 hover:scale-[1.02] transition-all active:scale-95"
                    >
                        Verify Circuit
                    </button>
                )}

            </div>
        </div>
    );
}
