
import React, { useState, useEffect } from 'react';

export default function ProbabilityEngine() {
    const [mode, setMode] = useState('coin'); // 'coin' or 'dice'
    const [history, setHistory] = useState([]);
    const [rolling, setRolling] = useState(false);

    // Stats
    const stats = mode === 'coin'
        ? { Heads: history.filter(r => r === 1).length, Tails: history.filter(r => r === 0).length }
        : {
            1: history.filter(r => r === 1).length,
            2: history.filter(r => r === 2).length,
            3: history.filter(r => r === 3).length,
            4: history.filter(r => r === 4).length,
            5: history.filter(r => r === 5).length,
            6: history.filter(r => r === 6).length,
        };

    const total = history.length;

    const reset = () => setHistory([]);

    const flip = (count = 1) => {
        setRolling(true);
        setTimeout(() => {
            const newResults = [];
            for (let i = 0; i < count; i++) {
                if (mode === 'coin') {
                    newResults.push(Math.random() < 0.5 ? 1 : 0); // 1=Heads, 0=Tails
                } else {
                    newResults.push(Math.floor(Math.random() * 6) + 1);
                }
            }
            setHistory(prev => [...prev, ...newResults]);
            setRolling(false);
        }, 300); // Animation delay
    };

    // Auto-run simulation
    useEffect(() => {
        setHistory([]);
    }, [mode]);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-dark-100 p-8 max-w-2xl mx-auto">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-dark-50 mb-1">Probability Engine 🎲</h2>
                    <p className="text-dark-400">See the Law of Large Numbers in action.</p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setMode('coin')}
                        className={`px-3 py-1 text-sm font-semibold rounded-md transition-all ${mode === 'coin' ? 'bg-white shadow-sm text-primary-600' : 'text-dark-300'}`}
                    >
                        Coin
                    </button>
                    <button
                        onClick={() => setMode('dice')}
                        className={`px-3 py-1 text-sm font-semibold rounded-md transition-all ${mode === 'dice' ? 'bg-white shadow-sm text-primary-600' : 'text-dark-300'}`}
                    >
                        Dice
                    </button>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-start">

                {/* Visuals Column */}
                <div className="flex flex-col items-center gap-8 min-h-[200px] justify-center">

                    {/* The "Review" - Latest Result */}
                    <div className={`relative transition-all duration-300 ${rolling ? 'animate-spin' : ''}`}>
                        {history.length === 0 ? (
                            <div className="w-32 h-32 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 font-bold">
                                ?
                            </div>
                        ) : (
                            mode === 'coin' ? (
                                <div className={`w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold shadow-lg border-4 ${history[history.length - 1] === 1 ? 'bg-yellow-400 border-yellow-500 text-yellow-800' : 'bg-gray-300 border-gray-400 text-gray-700'}`}>
                                    {history[history.length - 1] === 1 ? 'H' : 'T'}
                                </div>
                            ) : (
                                <div className="w-32 h-32 bg-white rounded-xl shadow-lg border-2 border-gray-200 flex items-center justify-center text-6xl font-bold text-dark-50">
                                    {history[history.length - 1]}
                                </div>
                            )
                        )}
                    </div>

                    {/* Stats Bar Chart */}
                    <div className="w-full space-y-2">
                        {Object.entries(stats).map(([label, count]) => {
                            const percent = total === 0 ? 0 : Math.round((count / total) * 100);
                            return (
                                <div key={label} className="flex items-center gap-2 text-xs">
                                    <span className="w-8 font-mono font-bold text-dark-400">{label}</span>
                                    <div className="flex-1 h-6 bg-gray-50 rounded-md overflow-hidden relative">
                                        <div
                                            className="h-full bg-primary-500 transition-all duration-500"
                                            style={{ width: `${percent}%` }}
                                        />
                                        <span className="absolute inset-y-0 left-2 flex items-center text-white mix-blend-difference font-bold">
                                            {count}
                                        </span>
                                    </div>
                                    <span className="w-10 text-right text-dark-300">{percent}%</span>
                                </div>
                            );
                        })}
                    </div>

                </div>

                {/* Controls Column */}
                <div className="space-y-6 bg-gray-50 p-6 rounded-xl border border-gray-100 h-full">

                    <div className="text-center">
                        <span className="text-4xl font-bold text-dark-50">{total}</span>
                        <p className="text-xs font-bold text-dark-300 uppercase tracking-wider mt-1">Total {mode === 'coin' ? 'Flips' : 'Rolls'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => flip(1)}
                            disabled={rolling}
                            className="bg-white border border-gray-200 hover:border-primary-500 hover:text-primary-600 font-bold py-3 px-4 rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50"
                        >
                            +1
                        </button>
                        <button
                            onClick={() => flip(10)}
                            disabled={rolling}
                            className="bg-white border border-gray-200 hover:border-primary-500 hover:text-primary-600 font-bold py-3 px-4 rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50"
                        >
                            +10
                        </button>
                        <button
                            onClick={() => flip(100)}
                            disabled={rolling}
                            className="col-span-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50"
                        >
                            🚀 Simulate 100
                        </button>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                        <button
                            onClick={reset}
                            className="w-full text-sm text-red-500 hover:text-red-600 font-semibold"
                        >
                            Reset Breakdown
                        </button>
                    </div>

                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-xs text-yellow-800 leading-relaxed">
                        <span className="font-bold">Did you know?</span> The more you roll, the closer the percentages get to exactly {mode === 'coin' ? '50%' : '16%'}. This is the <strong>Law of Large Numbers</strong>.
                    </div>

                </div>
            </div>
        </div>
    );
}
