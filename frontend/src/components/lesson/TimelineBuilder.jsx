import { useMemo, useState } from 'react'
import { Check, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'

const DEFAULT_EVENTS = [
    {
        id: 'norman-conquest',
        year: 1066,
        title: 'Norman Conquest',
        change: 'William of Normandy became king after the conquest, changing landholding and government across England.',
    },
    {
        id: 'magna-carta',
        year: 1215,
        title: 'Magna Carta',
        change: 'The charter is remembered for limiting royal power and expressing that the ruler was subject to law.',
    },
    {
        id: 'bill-of-rights',
        year: 1689,
        title: 'Bill of Rights settlement',
        change: 'The settlement helped define Parliament’s role and placed limits on the Crown after the seventeenth-century conflicts.',
    },
    {
        id: 'union-1707',
        year: 1707,
        title: 'Union of England and Scotland',
        change: 'The Acts of Union created the Kingdom of Great Britain, joining the two kingdoms under one Parliament.',
    },
    {
        id: 'union-1801',
        year: 1801,
        title: 'Union with Ireland',
        change: 'The later union created the United Kingdom of Great Britain and Ireland.',
    },
]

const SHUFFLED_IDS = ['union-1707', 'norman-conquest', 'union-1801', 'magna-carta', 'bill-of-rights']

/**
 * A small, keyboard-friendly timeline builder. Moving cards with buttons keeps
 * the activity usable on a phone and does not make drag-and-drop the only path.
 */
export default function TimelineBuilder({ block = {} }) {
    const events = Array.isArray(block.events) && block.events.length >= 2 ? block.events : DEFAULT_EVENTS
    const eventById = useMemo(() => new Map(events.map((event) => [event.id, event])), [events])
    const initialIds = events.map((event) => event.id)
    const shuffledIds = SHUFFLED_IDS.every((id) => eventById.has(id))
        ? SHUFFLED_IDS.filter((id) => eventById.has(id))
        : [...initialIds].reverse()
    const [order, setOrder] = useState(shuffledIds)
    const [checked, setChecked] = useState(false)

    const orderedEvents = order.map((id) => eventById.get(id)).filter(Boolean)
    const isCorrect = order.every((id, index) => id === initialIds[index])

    const move = (index, direction) => {
        const nextIndex = index + direction
        if (nextIndex < 0 || nextIndex >= order.length) return
        setOrder((current) => {
            const next = [...current]
            const [moved] = next.splice(index, 1)
            next.splice(nextIndex, 0, moved)
            return next
        })
        setChecked(false)
    }

    const reset = () => {
        setOrder(shuffledIds)
        setChecked(false)
    }

    return (
        <section className="my-8 rounded-3xl border border-dark-700 bg-dark-900/40 p-5">
            <span className="badge badge-primary">Try it</span>
            <h3 className="mt-3 text-lg font-semibold text-dark-50">
                {block.title || 'Build the timeline'}
            </h3>
            <p className="mt-1 text-sm leading-7 text-dark-300">
                {block.prompt || 'Put the events in chronological order. Then read what changed around each one.'}
            </p>

            <ol className="mt-5 space-y-3" aria-label="Historical events to order">
                {orderedEvents.map((event, index) => (
                    <li key={event.id} className="rounded-2xl border border-dark-700 bg-dark-900/70 p-4">
                        <div className="flex items-start gap-3">
                            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-500/15 text-sm font-semibold tabular-nums text-primary-300" aria-label={`Position ${index + 1}`}>
                                {index + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                    <span className="text-lg font-semibold text-dark-50">{event.title}</span>
                                    <span className="text-sm font-semibold tabular-nums text-accent-300">{event.year}</span>
                                </div>
                                {checked && isCorrect && (
                                    <p className="mt-2 text-sm leading-6 text-dark-300">{event.change}</p>
                                )}
                            </div>
                            <div className="flex flex-shrink-0 gap-1">
                                <button
                                    type="button"
                                    onClick={() => move(index, -1)}
                                    disabled={index === 0}
                                    className="btn-ghost h-9 w-9 p-0 disabled:cursor-not-allowed disabled:opacity-30"
                                    aria-label={`Move ${event.title} earlier`}
                                >
                                    <ChevronUp className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => move(index, 1)}
                                    disabled={index === orderedEvents.length - 1}
                                    className="btn-ghost h-9 w-9 p-0 disabled:cursor-not-allowed disabled:opacity-30"
                                    aria-label={`Move ${event.title} later`}
                                >
                                    <ChevronDown className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </li>
                ))}
            </ol>

            <div role="status" aria-live="polite" className={`mt-4 rounded-2xl border p-4 ${checked && isCorrect ? 'border-accent-500/40 bg-accent-500/10' : 'border-dark-700 bg-dark-900/60'}`}>
                <div className="flex items-start gap-3">
                    {checked && isCorrect && <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-400" />}
                    <p className={`text-sm font-medium ${checked && isCorrect ? 'text-accent-200' : 'text-dark-100'}`}>
                        {!checked
                            ? 'Use the arrows to put the earliest event first.'
                            : isCorrect
                                ? 'Correct sequence. Read each explanation to connect the date with the change.'
                                : 'Not yet — use the dates to place the earliest event first.'}
                    </p>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => setChecked(true)} className="btn-primary px-4 py-2 text-sm">
                    Check order
                </button>
                <button type="button" onClick={reset} className="btn-ghost px-4 py-2 text-sm">
                    <RotateCcw className="h-4 w-4" />
                    Reset
                </button>
            </div>
        </section>
    )
}
