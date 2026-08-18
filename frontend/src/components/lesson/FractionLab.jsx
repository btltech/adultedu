import { useMemo, useState } from 'react'
import { Check, RotateCcw } from 'lucide-react'

const MAX_DENOMINATOR = 12

function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b)
}

function simplify(numerator, denominator) {
    const divisor = gcd(numerator, denominator) || 1
    return [numerator / divisor, denominator / divisor]
}

/**
 * One bar the learner can change. The bar is the point: the numbers move and
 * the shaded area moves with them, so equivalence is something you see before
 * it is something you are told.
 */
function Bar({ label, numerator, denominator, onChange, accent }) {
    const parts = Array.from({ length: denominator }, (_, index) => index)
    const inputId = `fraction-${label.toLowerCase().replace(/\s+/g, '-')}`

    return (
        <div className="rounded-2xl border border-dark-700 bg-dark-900/60 p-4">
            <div className="mb-3 flex items-baseline justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-dark-400">{label}</span>
                <span className={`text-2xl font-semibold tabular-nums ${accent}`}>
                    {numerator}<span className="mx-0.5 text-dark-500">/</span>{denominator}
                </span>
            </div>

            <div className="flex gap-1" role="img" aria-label={`${numerator} of ${denominator} parts shaded`}>
                {parts.map((part) => (
                    <div
                        key={part}
                        className={`h-12 flex-1 rounded transition-colors duration-150 ${
                            part < numerator ? accent.replace('text-', 'bg-') : 'bg-dark-800'
                        }`}
                    />
                ))}
            </div>

            <div className="mt-4 space-y-3">
                <label className="block text-sm text-dark-300" htmlFor={`${inputId}-num`}>
                    Shaded parts: <span className="tabular-nums text-dark-100">{numerator}</span>
                    <input
                        id={`${inputId}-num`}
                        type="range"
                        min="0"
                        max={denominator}
                        value={numerator}
                        onChange={(event) => onChange(Number(event.target.value), denominator)}
                        className="mt-1 w-full accent-primary-500"
                    />
                </label>
                <label className="block text-sm text-dark-300" htmlFor={`${inputId}-den`}>
                    Total parts: <span className="tabular-nums text-dark-100">{denominator}</span>
                    <input
                        id={`${inputId}-den`}
                        type="range"
                        min="1"
                        max={MAX_DENOMINATOR}
                        value={denominator}
                        onChange={(event) => {
                            const nextDenominator = Number(event.target.value)
                            // Keep the fraction meaningful when the bar shrinks.
                            onChange(Math.min(numerator, nextDenominator), nextDenominator)
                        }}
                        className="mt-1 w-full accent-accent-500"
                    />
                </label>
            </div>
        </div>
    )
}

export default function FractionLab({ block = {} }) {
    const target = block.target || { numerator: 1, denominator: 2 }
    const [left, setLeft] = useState({ numerator: 1, denominator: 2 })
    const [right, setRight] = useState({ numerator: 2, denominator: 6 })

    const leftValue = left.numerator / left.denominator
    const rightValue = right.numerator / right.denominator
    const equivalent = Math.abs(leftValue - rightValue) < 1e-9

    const comparison = useMemo(() => {
        if (equivalent) return 'These two fractions are worth exactly the same.'
        const bigger = leftValue > rightValue ? 'left' : 'right'
        return `The ${bigger} fraction is larger, even though the numbers look different.`
    }, [equivalent, leftValue, rightValue])

    const [ls, ld] = simplify(left.numerator || 0, left.denominator)
    const [rs, rd] = simplify(right.numerator || 0, right.denominator)

    const reset = () => {
        setLeft({ numerator: 1, denominator: 2 })
        setRight({ numerator: 2, denominator: 6 })
    }

    return (
        <section className="my-8 rounded-3xl border border-dark-700 bg-dark-900/40 p-5">
            <div className="mb-4">
                <span className="badge badge-primary">Try it</span>
                <h3 className="mt-3 text-lg font-semibold text-dark-50">
                    {block.title || 'Make two different fractions worth the same'}
                </h3>
                <p className="mt-1 text-sm leading-7 text-dark-300">
                    {block.prompt || `Drag the sliders until both bars are shaded by the same amount. Notice that ${target.numerator}/${target.denominator} can be written many ways.`}
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <Bar
                    label="Left fraction"
                    numerator={left.numerator}
                    denominator={left.denominator}
                    accent="text-primary-400"
                    onChange={(numerator, denominator) => setLeft({ numerator, denominator })}
                />
                <Bar
                    label="Right fraction"
                    numerator={right.numerator}
                    denominator={right.denominator}
                    accent="text-accent-400"
                    onChange={(numerator, denominator) => setRight({ numerator, denominator })}
                />
            </div>

            <div
                role="status"
                aria-live="polite"
                className={`mt-4 rounded-2xl border p-4 ${
                    equivalent
                        ? 'border-accent-500/40 bg-accent-500/10'
                        : 'border-dark-700 bg-dark-900/60'
                }`}
            >
                <div className="flex items-start gap-3">
                    {equivalent && <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-400" />}
                    <div>
                        <p className={`text-sm font-medium ${equivalent ? 'text-accent-200' : 'text-dark-100'}`}>
                            {comparison}
                        </p>
                        <p className="mt-1 text-sm text-dark-400">
                            {left.numerator}/{left.denominator} simplifies to {ls}/{ld}
                            {' · '}
                            {right.numerator}/{right.denominator} simplifies to {rs}/{rd}
                            {equivalent && ' — same simplest form, which is what makes them equivalent.'}
                        </p>
                    </div>
                </div>
            </div>

            <button type="button" onClick={reset} className="btn-ghost mt-4 px-4 py-2 text-sm">
                <RotateCcw className="h-4 w-4" />
                Reset
            </button>
        </section>
    )
}
