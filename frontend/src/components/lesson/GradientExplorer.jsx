import { useState } from 'react'

const WIDTH = 320
const HEIGHT = 220
const UNITS = 5

/**
 * y = mx + c is two numbers doing two very different jobs. Dragging each one
 * separately and watching which part of the line responds is faster and more
 * durable than being told which letter is which.
 */
export default function GradientExplorer({ block = {} }) {
    const [gradient, setGradient] = useState(block.gradient ?? 1)
    const [intercept, setIntercept] = useState(block.intercept ?? 0)

    // Graph units -> SVG pixels, origin centred.
    const toX = (x) => (x + UNITS) * (WIDTH / (UNITS * 2))
    const toY = (y) => HEIGHT - (y + UNITS) * (HEIGHT / (UNITS * 2))

    const leftY = gradient * -UNITS + intercept
    const rightY = gradient * UNITS + intercept

    const ticks = Array.from({ length: UNITS * 2 + 1 }, (_, i) => i - UNITS)

    /**
     * Write the equation the way it would be written by hand. A maths lesson
     * that prints "y = 1x + 0" is teaching notation it would mark wrong.
     */
    const equation = (() => {
        if (gradient === 0) return `y = ${intercept}`
        const m = gradient === 1 ? 'x' : gradient === -1 ? '−x' : `${String(gradient).replace('-', '−')}x`
        if (intercept === 0) return `y = ${m}`
        return `y = ${m} ${intercept < 0 ? '−' : '+'} ${Math.abs(intercept)}`
    })()

    return (
        <section className="my-8 rounded-3xl border border-dark-700 bg-dark-900/40 p-5">
            <span className="badge badge-primary">Try it</span>
            <h3 className="mt-3 text-lg font-semibold text-dark-50">
                {block.title || 'See what m and c actually do'}
            </h3>
            <p className="mt-1 text-sm leading-7 text-dark-300">
                {block.prompt || 'Change the gradient and watch the line tilt. Change the intercept and watch it slide up and down without tilting at all.'}
            </p>

            <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
                <svg
                    viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                    className="w-full max-w-sm rounded-xl border border-dark-700 bg-dark-950"
                    role="img"
                    aria-label={`Line with gradient ${gradient} and y-intercept ${intercept}`}
                >
                    {ticks.map((tick) => (
                        <g key={tick}>
                            <line x1={toX(tick)} y1="0" x2={toX(tick)} y2={HEIGHT} stroke="currentColor" className="text-dark-800" strokeWidth="1" />
                            <line x1="0" y1={toY(tick)} x2={WIDTH} y2={toY(tick)} stroke="currentColor" className="text-dark-800" strokeWidth="1" />
                        </g>
                    ))}
                    <line x1={toX(0)} y1="0" x2={toX(0)} y2={HEIGHT} stroke="currentColor" className="text-dark-600" strokeWidth="1.5" />
                    <line x1="0" y1={toY(0)} x2={WIDTH} y2={toY(0)} stroke="currentColor" className="text-dark-600" strokeWidth="1.5" />

                    <line
                        x1={toX(-UNITS)} y1={toY(leftY)} x2={toX(UNITS)} y2={toY(rightY)}
                        stroke="currentColor" className="text-primary-400" strokeWidth="2.5" strokeLinecap="round"
                    />
                    {/* The intercept is the one point the gradient cannot move. */}
                    <circle cx={toX(0)} cy={toY(intercept)} r="5" className="fill-accent-400" />
                </svg>

                <div className="w-full space-y-4 sm:max-w-xs">
                    <label className="block text-sm text-dark-300">
                        Gradient (m): <span className="tabular-nums text-dark-100">{gradient}</span>
                        <input
                            type="range" min="-3" max="3" step="0.5" value={gradient}
                            onChange={(event) => setGradient(Number(event.target.value))}
                            className="mt-1 w-full accent-primary-500" aria-label="Gradient"
                        />
                        <span className="mt-1 block text-xs text-dark-500">Tilts the line. Negative slopes downhill.</span>
                    </label>

                    <label className="block text-sm text-dark-300">
                        Intercept (c): <span className="tabular-nums text-dark-100">{intercept}</span>
                        <input
                            type="range" min="-4" max="4" step="1" value={intercept}
                            onChange={(event) => setIntercept(Number(event.target.value))}
                            className="mt-1 w-full accent-accent-500" aria-label="Y-intercept"
                        />
                        <span className="mt-1 block text-xs text-dark-500">Slides the line without changing its tilt.</span>
                    </label>
                </div>
            </div>

            <div role="status" aria-live="polite" className="mt-4 rounded-2xl border border-dark-700 bg-dark-900/60 p-4">
                <p className="text-lg font-semibold tabular-nums text-dark-50">{equation}</p>
                <p className="mt-1 text-sm text-dark-300">
                    {gradient === 0
                        ? 'A gradient of zero makes the line flat — y never changes, whatever x does.'
                        : `Every 1 step right moves the line ${Math.abs(gradient)} ${gradient > 0 ? 'up' : 'down'}.`}
                    {' '}It crosses the y-axis at {intercept}, marked by the dot.
                </p>
            </div>
        </section>
    )
}
