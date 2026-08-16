import { Link } from 'react-router-dom'
import { ArrowRight, BookOpenCheck, CheckCircle2, PlayCircle } from 'lucide-react'

export default function LearningPathPanel({
    eyebrow = 'Course map',
    title,
    description,
    items = [],
    currentId = null,
    completedIds = [],
    getHref,
    emptyState = 'The learning path will appear here once content is available.',
}) {
    const completedSet = new Set(completedIds)

    return (
        <div className="progress-panel">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-300">{eyebrow}</p>
            <h2 className="mt-3 text-xl font-semibold text-dark-50">{title}</h2>
            {description && <p className="mt-3 text-sm leading-7 text-dark-300">{description}</p>}

            {items.length > 0 ? (
                <div className="mt-5 space-y-3">
                    {items.map((item, index) => {
                        const isCurrent = item.id === currentId
                        const isCompleted = completedSet.has(item.id)
                        const href = getHref?.(item)

                        return (
                            <Link
                                key={item.id}
                                to={href || '#'}
                                aria-current={isCurrent ? 'step' : undefined}
                                className={`block rounded-2xl border p-4 transition-all ${isCurrent
                                    ? 'border-primary-500/60 bg-primary-500/10'
                                    : 'border-dark-800/80 bg-dark-900/60 hover:border-dark-600'
                                    } ${href ? '' : 'pointer-events-none opacity-60'}`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${isCurrent
                                        ? 'bg-primary-500/20 text-primary-300'
                                        : isCompleted
                                            ? 'bg-accent-500/20 text-accent-300'
                                            : 'bg-dark-800 text-dark-300'
                                        }`}>
                                        {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-dark-100">{item.title}</p>
                                                {item.meta && <p className="mt-1 text-xs text-dark-400">{item.meta}</p>}
                                            </div>
                                            {isCurrent ? (
                                                <span className="badge badge-primary">Current</span>
                                            ) : isCompleted ? (
                                                <span className="badge badge-neutral">Done</span>
                                            ) : (
                                                <PlayCircle className="h-4 w-4 flex-shrink-0 text-dark-500" />
                                            )}
                                        </div>

                                        {item.description && (
                                            <p className="mt-2 text-sm leading-6 text-dark-300">{item.description}</p>
                                        )}

                                        {href && (
                                            <div className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary-300">
                                                {isCurrent ? 'Continue here' : 'Open step'}
                                                <ArrowRight className="h-4 w-4" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            ) : (
                <div className="mt-5 rounded-2xl border border-dark-800/80 bg-dark-900/60 p-4 text-sm text-dark-300">
                    <div className="flex items-start gap-3">
                        <BookOpenCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-300" />
                        <p>{emptyState}</p>
                    </div>
                </div>
            )}
        </div>
    )
}