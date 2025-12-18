
import React, { useState } from 'react';

export default function FractionExplorer() {
    const [numerator, setNumerator] = useState(1);
    const [denominator, setDenominator] = useState(2);

    // Calculate percentage
    const percentage = Math.round((numerator / denominator) * 100);
    const angle = (numerator / denominator) * 360;

    // SVG calculations for pie chart
    const radius = 50;
    const center = 60;
    const x = center + radius * Math.cos((angle - 90) * (Math.PI / 180));
    const y = center + radius * Math.sin((angle - 90) * (Math.PI / 180));

    // SVG path command for arc
    // M = Move to center
    // L = Line to top (start)
    // A = Arc to calculated end point
    // Z = Close path
    const largeArc = angle > 180 ? 1 : 0;
    const pathData = denominator === 1
        ? `M ${center} ${center - radius} A ${radius} ${radius} 0 1 1 ${center - 0.1} ${center - radius} Z` // Full circle hack
        : `M ${center} ${center} L ${center} ${center - radius} A ${radius} ${radius} 0 ${largeArc} 1 ${x} ${y} Z`;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-dark-100 p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-dark-50 mb-2">Fraction Explorer 🍰</h2>
            <p className="text-dark-400 mb-8">Drag the sliders to see how fractions, percentages, and shapes relate.</p>

            <div className="grid md:grid-cols-2 gap-12 items-center">

                {/* Visuals Column */}
                <div className="flex flex-col items-center gap-8">
                    {/* Pie Chart */}
                    <div className="relative group">
                        <svg width="120" height="120" viewBox="0 0 120 120" className="transform -rotate-0 transition-all duration-500 ease-out">
                            {/* Background Circle */}
                            <circle cx="60" cy="60" r="50" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="2" />
                            {/* Filled Slice */}
                            {numerator > 0 && (
                                <path d={pathData} fill="#8b5cf6" className="drop-shadow-sm opacity-90" />
                            )}
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-xs font-bold bg-white/90 px-2 py-1 rounded-full shadow-sm backdrop-blur-sm">
                                {percentage}%
                            </span>
                        </div>
                    </div>

                    {/* Bar Chart Representation */}
                    <div className="w-full">
                        <div className="flex justify-between text-xs text-dark-400 mb-2">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                        </div>
                        <div className="h-6 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                            <div
                                className="h-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-300 ease-out relative"
                                style={{ width: `${percentage}%` }}
                            >
                                <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/30" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls Column */}
                <div className="space-y-8 bg-gray-50 p-6 rounded-xl border border-gray-100">

                    {/* Big Fraction Display */}
                    <div className="flex flex-col items-center justify-center">
                        <div className="text-5xl font-bold text-dark-50 transition-all scale-100 hover:scale-110 duration-200">
                            {numerator}
                        </div>
                        <div className="w-24 h-1 bg-dark-200 my-2 rounded-full"></div>
                        <div className="text-5xl font-bold text-dark-50 transition-all scale-100 hover:scale-110 duration-200">
                            {denominator}
                        </div>
                    </div>

                    {/* Sliders */}
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-semibold text-dark-300">Numerator (Top)</label>
                                <span className="text-sm font-bold text-primary-600">{numerator}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max={denominator}
                                value={numerator}
                                onChange={(e) => setNumerator(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-semibold text-dark-300">Denominator (Bottom)</label>
                                <span className="text-sm font-bold text-primary-600">{denominator}</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="12"
                                value={denominator}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setDenominator(val);
                                    if (numerator > val) setNumerator(val);
                                }}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                            />
                        </div>
                    </div>

                    {/* Real-world equivalents hint */}
                    <div className="pt-2 text-center">
                        <p className="text-sm text-dark-400 italic">
                            {numerator === 1 && denominator === 2 && "Half calculation!"}
                            {numerator === 1 && denominator === 4 && "A quarter slice!"}
                            {numerator === 3 && denominator === 4 && "Three quarters full!"}
                            {numerator === denominator && "One whole unit!"}
                            {numerator === 0 && "Nothing at all!"}
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
