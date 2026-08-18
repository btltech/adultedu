import { useMemo, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'

const SEGMENT_COLOURS = ['bg-primary-500', 'bg-accent-500', 'bg-amber-500', 'bg-rose-500']

/**
 * The law of large numbers is a claim prose can only assert. Here the learner
 * spins ten times and sees noise, spins a thousand and watches the observed
 * frequency settle onto the theoretical one — which is the entire idea.
 */
export default function ProbabilitySpinner({ block = {} }) {
    const outcomes = Array.isArray(block.outcomes) && block.outcomes.length >= 2
        ? block.outcomes.slice(0, SEGMENT_COLOURS.length)
        : ['Red', 'Blue', 'Green', 'Yellow']

    const [counts, setCounts] = useState(() => outcomes.map(() => 0))
    const [lastResult, setLastResult] = useState(null)
    // Checkpoints of (spins, gap) so the learner sees a trend rather than
    // comparing two points. Ten spins landing exactly on the theoretical share
    // is common with few outcomes, and a single before/after reading can then
    // show the gap growing — which is luck, not a counterexample.
    const [history, setHistory] = useState([])
    const spinning = useRef(false)

    const total = counts.reduce((sum, count) => sum + count, 0)
    const theoretical = 1 / outcomes.length

    const spin = (times) => {
        if (spinning.current) return
        spinning.current = true

        // Derive the next state first, then set each piece once. Updating
        // history from inside the counts updater made it a side effect of a
        // state reducer, which React is free to run more than once — and did,
        // recording every batch twice.
        const next = [...counts]
        let last = null
        for (let i = 0; i < times; i += 1) {
            const index = Math.floor(Math.random() * outcomes.length)
            next[index] += 1
            last = index
        }

        const nextTotal = next.reduce((sum, count) => sum + count, 0)
        const worst = Math.max(...next.map((count) => Math.abs(count / nextTotal - theoretical)))

        setCounts(next)
        setLastResult(last)
        setHistory((entries) => [...entries, { spins: nextTotal, gap: worst }].slice(-8))
        spinning.current = false
    }

    const reset = () => {
        setCounts(outcomes.map(() => 0))
        setLastResult(null)
        setHistory([])
    }

    // How far the worst outcome still sits from its theoretical share.
    const worstGap = useMemo(() => {
        if (!total) return null
        return Math.max(...counts.map((count) => Math.abs(count / total - theoretical)))
    }, [counts, total, theoretical])

    return (
        <section className="my-8 rounded-3xl border border-dark-700 bg-dark-900/40 p-5">
            <span className="badge badge-primary">Try it</span>
            <h3 className="mt-3 text-lg font-semibold text-dark-50">
                {block.title || 'Watch chance settle down'}
            </h3>
            <p className="mt-1 text-sm leading-7 text-dark-300">
                {block.prompt || `Each outcome should come up about ${Math.round(theoretical * 100)}% of the time. Spin a few times and the results look lopsided. Keep spinning and watch them even out.`}
            </p>

            <div className="mt-5 space-y-3">
                {outcomes.map((outcome, index) => {
                    const count = counts[index]
                    const share = total ? count / total : 0
                    return (
                        <div key={outcome}>
                            <div className="mb-1 flex items-baseline justify-between text-sm">
                                <span className={lastResult === index ? 'font-semibold text-dark-50' : 'text-dark-300'}>
                                    {outcome}
                                </span>
                                <span className="tabular-nums text-dark-400">
                                    {count} {total > 0 && <span className="text-dark-500">({Math.round(share * 100)}%)</span>}
                                </span>
                            </div>
                            <div className="relative h-6 overflow-hidden rounded-lg bg-dark-800">
                                <div
                                    className={`h-full ${SEGMENT_COLOURS[index]} transition-all duration-300`}
                                    style={{ width: `${share * 100}%` }}
                                />
                                {/* The line the bars should converge on. */}
                                <div
                                    className="absolute inset-y-0 w-px bg-dark-100/70"
                                    style={{ left: `${theoretical * 100}%` }}
                                    aria-hidden="true"
                                />
                            </div>
                        </div>
                    )
                })}
            </div>

            <p className="mt-3 text-xs text-dark-500">
                The pale line marks the theoretical {Math.round(theoretical * 100)}%.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
                {[1, 10, 100, 1000].map((times) => (
                    <button key={times} type="button" onClick={() => spin(times)} className="btn-secondary px-4 py-2 text-sm">
                        Spin {times}×
                    </button>
                ))}
                <button type="button" onClick={reset} className="btn-ghost px-4 py-2 text-sm">
                    <RotateCcw className="h-4 w-4" />
                    Reset
                </button>
            </div>

            <div role="status" aria-live="polite" className="mt-4 rounded-2xl border border-dark-700 bg-dark-900/60 p-4 text-sm">
                {total === 0 ? (
                    <p className="text-dark-400">No spins yet. Start with 10, then try 1000.</p>
                ) : (
                    <>
                        <p className="text-dark-200">
                            {total} spin{total === 1 ? '' : 's'}. The furthest any outcome sits from {Math.round(theoretical * 100)}% is{' '}
                            <span className="font-semibold text-dark-50">
                                {Math.round(worstGap * 100)} percentage point{Math.round(worstGap * 100) === 1 ? '' : 's'}
                            </span>
                            {total >= 500
                                ? ' — and with this many spins it will stay small however often you try.'
                                : ' — but with this few spins that number is unreliable. It can land perfectly on chance or miss badly, purely by luck.'}
                        </p>

                        {history.length > 1 && (
                            <div className="mt-3 border-t border-dark-700 pt-3">
                                <p className="mb-2 text-xs uppercase tracking-[0.14em] text-dark-500">Gap as spins add up</p>
                                <div className="space-y-1">
                                    {history.map((entry, index) => (
                                        <div key={index} className="flex items-center gap-2 text-xs">
                                            <span className="w-16 tabular-nums text-right text-dark-400">{entry.spins}</span>
                                            <div className="h-2 flex-1 overflow-hidden rounded bg-dark-800">
                                                <div className="h-full bg-primary-500/70" style={{ width: `${Math.min(100, entry.gap * 300)}%` }} />
                                            </div>
                                            <span className="w-10 tabular-nums text-dark-400">{Math.round(entry.gap * 100)}%</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="mt-2 text-xs leading-6 text-dark-500">
                                    Small runs bounce around. Large runs stay close — that reliability is the point, not a gap that only ever shrinks.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    )
}
