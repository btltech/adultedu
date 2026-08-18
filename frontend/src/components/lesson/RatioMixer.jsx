import { useState } from 'react'

function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b)
}

/**
 * Ratio is about relationship, not amount. Scaling the batch keeps the mix
 * identical while every number changes — which is the part learners tend to
 * lose when they meet ratios only as pairs of numbers on a page.
 */
export default function RatioMixer({ block = {} }) {
    const labels = block.labels || ['Concentrate', 'Water']
    const [parts, setParts] = useState(block.ratio || [1, 4])
    const [batches, setBatches] = useState(1)

    const totalParts = parts.reduce((sum, part) => sum + part, 0)
    const divisor = gcd(parts[0], parts[1]) || 1
    const simplified = parts.map((part) => part / divisor)
    const isSimplest = divisor === 1

    const setPart = (index, value) => {
        setParts((current) => current.map((part, i) => (i === index ? Math.max(1, value) : part)))
    }

    return (
        <section className="my-8 rounded-3xl border border-dark-700 bg-dark-900/40 p-5">
            <span className="badge badge-primary">Try it</span>
            <h3 className="mt-3 text-lg font-semibold text-dark-50">
                {block.title || 'Scale a recipe without changing the mix'}
            </h3>
            <p className="mt-1 text-sm leading-7 text-dark-300">
                {block.prompt || 'Change the ratio and watch the mixture change. Then increase the batches: every amount grows, but the mixture stays exactly the same.'}
            </p>

            {/* One bar for the whole mixture makes the proportion visible at a glance. */}
            <div className="mt-5 flex h-14 overflow-hidden rounded-xl border border-dark-700">
                <div
                    className="flex items-center justify-center bg-primary-500/80 text-sm font-medium text-white transition-all duration-200"
                    style={{ width: `${(parts[0] / totalParts) * 100}%` }}
                >
                    {Math.round((parts[0] / totalParts) * 100)}%
                </div>
                <div
                    className="flex items-center justify-center bg-accent-500/80 text-sm font-medium text-white transition-all duration-200"
                    style={{ width: `${(parts[1] / totalParts) * 100}%` }}
                >
                    {Math.round((parts[1] / totalParts) * 100)}%
                </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {labels.map((label, index) => (
                    <label key={label} className="block text-sm text-dark-300">
                        {label} parts: <span className="tabular-nums text-dark-100">{parts[index]}</span>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={parts[index]}
                            onChange={(event) => setPart(index, Number(event.target.value))}
                            className={`mt-1 w-full ${index === 0 ? 'accent-primary-500' : 'accent-accent-500'}`}
                            aria-label={`${label} parts`}
                        />
                    </label>
                ))}
            </div>

            <label className="mt-4 block text-sm text-dark-300">
                Batches: <span className="tabular-nums text-dark-100">{batches}</span>
                <input
                    type="range"
                    min="1"
                    max="12"
                    value={batches}
                    onChange={(event) => setBatches(Number(event.target.value))}
                    className="mt-1 w-full accent-dark-400"
                    aria-label="Number of batches"
                />
            </label>

            <div role="status" aria-live="polite" className="mt-4 rounded-2xl border border-dark-700 bg-dark-900/60 p-4">
                <p className="text-sm text-dark-100">
                    Ratio <span className="font-semibold">{parts[0]} : {parts[1]}</span>
                    {!isSimplest && <span className="text-dark-400"> (simplest form {simplified[0]} : {simplified[1]})</span>}
                </p>
                <p className="mt-1 text-sm text-dark-300">
                    For {batches} batch{batches === 1 ? '' : 'es'} you need{' '}
                    <span className="font-semibold text-dark-50">{parts[0] * batches}</span> {labels[0].toLowerCase()} and{' '}
                    <span className="font-semibold text-dark-50">{parts[1] * batches}</span> {labels[1].toLowerCase()}.
                </p>
                <p className="mt-2 text-sm text-dark-400">
                    The amounts changed, but the mixture did not — {Math.round((parts[0] / totalParts) * 100)}% {labels[0].toLowerCase()} either way. That is what a ratio holds fixed.
                </p>
            </div>
        </section>
    )
}
