import { useState } from 'react'
import { motion } from 'framer-motion'

/**
 * PercentageVisualizer - Interactive visual percentage exploration
 * Great for understanding fractions, percentages, and proportions
 */
export default function PercentageVisualizer({
    initialValue = 50,
    onValueChange,
    showFraction = true,
    showDecimal = true,
    color = '#6366f1',
    size = 200,
    rows = 10,
    cols = 10,
}) {
    const [value, setValue] = useState(initialValue)
    const [isDragging, setIsDragging] = useState(false)

    const totalCells = rows * cols
    const filledCells = Math.round((value / 100) * totalCells)
    const cellSize = (size - (cols - 1) * 2) / cols

    const handleCellInteraction = (index) => {
        const newFilledCount = index + 1
        const newValue = Math.round((newFilledCount / totalCells) * 100)
        setValue(newValue)
        onValueChange?.(newValue)
    }

    const handleMouseDown = (index) => {
        setIsDragging(true)
        handleCellInteraction(index)
    }

    const handleMouseEnter = (index) => {
        if (isDragging) {
            handleCellInteraction(index)
        }
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    // Simplified fraction
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b)
    const simplify = (num, den) => {
        const divisor = gcd(num, den)
        return [num / divisor, den / divisor]
    }
    const [fracNum, fracDen] = simplify(filledCells, totalCells)

    return (
        <div
            className="flex flex-col items-center gap-6"
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Grid */}
            <div
                className="p-4 bg-dark-900 rounded-2xl border border-dark-700"
                style={{ width: size + 32, userSelect: 'none' }}
            >
                <div
                    className="grid"
                    style={{
                        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
                        gap: '2px',
                    }}
                >
                    {Array.from({ length: totalCells }).map((_, index) => {
                        const isFilled = index < filledCells
                        const isEdge = index === filledCells - 1

                        return (
                            <motion.div
                                key={index}
                                onMouseDown={() => handleMouseDown(index)}
                                onMouseEnter={() => handleMouseEnter(index)}
                                onTouchStart={() => handleMouseDown(index)}
                                className="rounded-sm cursor-pointer transition-all duration-100"
                                style={{
                                    width: cellSize,
                                    height: cellSize,
                                    backgroundColor: isFilled ? color : '#374151',
                                    boxShadow: isEdge ? `0 0 8px ${color}` : 'none',
                                }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                animate={{
                                    backgroundColor: isFilled ? color : '#374151',
                                    opacity: isFilled ? 1 : 0.5,
                                }}
                                transition={{ duration: 0.1 }}
                            />
                        )
                    })}
                </div>
            </div>

            {/* Value display */}
            <div className="flex items-center justify-center gap-6 flex-wrap">
                {/* Percentage */}
                <div className="text-center">
                    <div
                        className="text-4xl font-bold"
                        style={{ color }}
                    >
                        {value}%
                    </div>
                    <div className="text-xs text-dark-500 mt-1">Percentage</div>
                </div>

                {/* Fraction */}
                {showFraction && (
                    <div className="text-center px-4 border-l border-dark-700">
                        <div className="text-2xl font-bold text-dark-200">
                            <span className="inline-flex flex-col items-center">
                                <span>{fracNum}</span>
                                <span className="w-full h-0.5 bg-dark-400 my-0.5" />
                                <span>{fracDen}</span>
                            </span>
                        </div>
                        <div className="text-xs text-dark-500 mt-1">Fraction</div>
                    </div>
                )}

                {/* Decimal */}
                {showDecimal && (
                    <div className="text-center px-4 border-l border-dark-700">
                        <div className="text-2xl font-bold text-dark-200">
                            {(value / 100).toFixed(2)}
                        </div>
                        <div className="text-xs text-dark-500 mt-1">Decimal</div>
                    </div>
                )}

                {/* Count */}
                <div className="text-center px-4 border-l border-dark-700">
                    <div className="text-2xl font-bold text-dark-200">
                        {filledCells}/{totalCells}
                    </div>
                    <div className="text-xs text-dark-500 mt-1">Count</div>
                </div>
            </div>

            {/* Slider for fine control */}
            <div className="w-full max-w-xs">
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => {
                        const newValue = Number(e.target.value)
                        setValue(newValue)
                        onValueChange?.(newValue)
                    }}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                        background: `linear-gradient(to right, ${color} ${value}%, #374151 ${value}%)`,
                    }}
                />
            </div>
        </div>
    )
}
