
import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

export default function GraphPlotter({ targetSlope, targetIntercept, isChallenge = false, onCorrect }) {
    const [slope, setSlope] = useState(1);
    const [intercept, setIntercept] = useState(0);
    const [feedback, setFeedback] = useState(null);

    // Reset state when challenge changes
    useEffect(() => {
        if (isChallenge) {
            setSlope(1);
            setIntercept(0);
            setFeedback(null);
        }
    }, [targetSlope, targetIntercept, isChallenge]);

    // Grid config
    const size = 300;
    const range = 10; // -10 to 10
    const scale = size / (range * 2);
    const center = size / 2;

    const toSvg = (x, y) => ({
        x: center + x * scale,
        y: center - y * scale
    });

    // Calculate User Line
    const start = toSvg(-range, slope * -range + intercept);
    const end = toSvg(range, slope * range + intercept);

    // Calculate Target Line (Ghost Line)
    const targetStart = isChallenge ? toSvg(-range, targetSlope * -range + targetIntercept) : null;
    const targetEnd = isChallenge ? toSvg(range, targetSlope * range + targetIntercept) : null;

    const checkAnswer = () => {
        if (Math.abs(slope - targetSlope) < 0.1 && Math.abs(intercept - targetIntercept) < 0.1) {
            setFeedback('correct');
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            if (onCorrect) onCorrect();
        } else {
            setFeedback('incorrect');
            setTimeout(() => setFeedback(null), 2000);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-dark-100 p-8 max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-dark-50">
                        {isChallenge ? 'Graph Challenge 🎯' : 'Linear Graph Plotter 📈'}
                    </h2>
                    <p className="text-dark-400">
                        {isChallenge
                            ? `Match the line: y = ${targetSlope}x ${targetIntercept >= 0 ? '+' : ''} ${targetIntercept}`
                            : 'Explore how slope and intercept change the line.'}
                    </p>
                </div>
                {isChallenge && (
                    <div className="text-right">
                        {feedback === 'correct' && <span className="text-green-600 font-bold animate-bounce block">Correct! 🎉</span>}
                        {feedback === 'incorrect' && <span className="text-red-500 font-bold animate-pulse block">Try Again ❌</span>}
                    </div>
                )}
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-start">

                {/* Graph Column */}
                <div className="flex justify-center bg-gray-50 rounded-xl p-4 border border-gray-100 relative overflow-hidden">
                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                        <defs>
                            <pattern id="grid" width={scale} height={scale} patternUnits="userSpaceOnUse">
                                <path d={`M ${scale} 0 L 0 0 0 ${scale}`} fill="none" stroke="#e5e7eb" strokeWidth="1" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                        <line x1="0" y1={center} x2={size} y2={center} stroke="#9ca3af" strokeWidth="2" />
                        <line x1={center} y1="0" x2={center} y2={size} stroke="#9ca3af" strokeWidth="2" />

                        {/* Ghost Target Line (Dashed) */}
                        {isChallenge && (
                            <line
                                x1={targetStart.x} y1={targetStart.y}
                                x2={targetEnd.x} y2={targetEnd.y}
                                stroke="#cbd5e1"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeDasharray="10,5"
                            />
                        )}

                        {/* User Plotted Line */}
                        <line
                            x1={start.x} y1={start.y}
                            x2={end.x} y2={end.y}
                            stroke={feedback === 'correct' ? '#22c55e' : '#8b5cf6'}
                            strokeWidth="4"
                            strokeLinecap="round"
                            className="transition-all duration-300 ease-out"
                        />
                        <circle
                            cx={center}
                            cy={center - intercept * scale}
                            r="6"
                            fill={feedback === 'correct' ? '#22c55e' : '#ec4899'}
                        />
                    </svg>
                </div>

                {/* Controls Column */}
                <div className="space-y-8 bg-gray-50 p-6 rounded-xl border border-gray-100 h-full">

                    {/* Visual Equation */}
                    <div className="text-center p-4 bg-white rounded-xl border border-dashed border-dark-200 shadow-sm">
                        <span className="text-xl font-serif italic text-dark-300">y</span>
                        <span className="text-xl font-bold mx-2 text-dark-200">=</span>
                        <span className="text-2xl font-bold text-primary-500">{slope}</span>
                        <span className="text-xl font-serif italic text-dark-300">x</span>
                        <span className="text-xl font-bold mx-2 text-dark-200">+</span>
                        <span className="text-2xl font-bold text-accent-500">{intercept}</span>
                    </div>

                    {/* Sliders */}
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-xs font-bold text-dark-300 uppercase tracking-wide">Slope (m)</label>
                                <span className="text-sm font-bold text-primary-600">{slope}</span>
                            </div>
                            <input
                                type="range"
                                min="-10" max="10" step="0.5"
                                value={slope}
                                onChange={(e) => setSlope(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-xs font-bold text-dark-300 uppercase tracking-wide">Y-Intercept (c)</label>
                                <span className="text-sm font-bold text-accent-600">{intercept}</span>
                            </div>
                            <input
                                type="range"
                                min="-10" max="10" step="1"
                                value={intercept}
                                onChange={(e) => setIntercept(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-accent-500"
                            />
                        </div>
                    </div>

                    {isChallenge && (
                        <button
                            onClick={checkAnswer}
                            className="w-full py-3 bg-dark-50 text-white font-bold rounded-xl shadow-lg hover:bg-dark-100 hover:scale-[1.02] transition-all active:scale-95"
                        >
                            Check Answer
                        </button>
                    )}

                </div>
            </div>
        </div>
    );
}
