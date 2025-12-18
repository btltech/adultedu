import { useState, useEffect } from 'react'
import { api } from '../../lib/api'

/**
 * StreakCalendar - GitHub-style activity calendar showing daily study activity
 */
export default function StreakCalendar() {
    const [calendar, setCalendar] = useState([])
    const [loading, setLoading] = useState(true)
    const [hovered, setHovered] = useState(null)

    useEffect(() => {
        async function fetchCalendar() {
            try {
                const data = await api('/analytics/calendar')
                setCalendar(data.calendar || [])
            } catch (err) {
                console.log('Could not fetch calendar:', err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchCalendar()
    }, [])

    // Generate last 12 weeks of dates
    const weeks = []
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 84) // 12 weeks

    for (let i = 0; i < 12; i++) {
        const week = []
        for (let j = 0; j < 7; j++) {
            const date = new Date(startDate)
            date.setDate(date.getDate() + (i * 7) + j)

            const dateStr = date.toISOString().split('T')[0]
            const activity = calendar.find(c => c.date === dateStr)

            week.push({
                date: dateStr,
                displayDate: date.toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short'
                }),
                questions: activity?.questions || 0,
                correct: activity?.correct || 0,
                accuracy: activity?.accuracy || 0,
                isToday: dateStr === today.toISOString().split('T')[0],
                isFuture: date > today
            })
        }
        weeks.push(week)
    }

    const getIntensity = (questions) => {
        if (questions === 0) return 'bg-dark-800'
        if (questions <= 3) return 'bg-primary-900'
        if (questions <= 6) return 'bg-primary-700'
        if (questions <= 10) return 'bg-primary-500'
        return 'bg-primary-400'
    }

    if (loading) {
        return (
            <div className="space-y-2">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex gap-1">
                        {[1, 2, 3, 4, 5, 6, 7].map(j => (
                            <div key={j} className="skeleton w-7 h-7 rounded" />
                        ))}
                    </div>
                ))}
            </div>
        )
    }

    // Day labels
    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

    return (
        <div className="relative">
            {/* Day labels column */}
            <div className="flex gap-1 mb-2">
                <div className="w-6" /> {/* Spacer for week alignment */}
                {dayLabels.map((day, i) => (
                    <div key={i} className="w-7 text-center text-xs text-dark-500">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="space-y-1">
                {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex gap-1">
                        {/* Week number or month label */}
                        <div className="w-6 text-xs text-dark-500 flex items-center justify-end pr-1">
                            {weekIndex === 0 || week[0].displayDate.includes('1') && !week[0].displayDate.includes('1 ') ?
                                week[0].displayDate.split(' ')[1] : ''}
                        </div>

                        {week.map((day, dayIndex) => (
                            <div
                                key={dayIndex}
                                className={`
                                    w-7 h-7 rounded cursor-pointer transition-all relative
                                    ${day.isFuture ? 'opacity-20' : ''}
                                    ${day.isToday ? 'ring-2 ring-primary-400' : ''}
                                    ${getIntensity(day.questions)}
                                `}
                                onMouseEnter={() => setHovered(day)}
                                onMouseLeave={() => setHovered(null)}
                            />
                        ))}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-4 text-xs text-dark-400">
                <span>Less</span>
                <div className="w-4 h-4 rounded bg-dark-800" />
                <div className="w-4 h-4 rounded bg-primary-900" />
                <div className="w-4 h-4 rounded bg-primary-700" />
                <div className="w-4 h-4 rounded bg-primary-500" />
                <div className="w-4 h-4 rounded bg-primary-400" />
                <span>More</span>
            </div>

            {/* Tooltip */}
            {hovered && !hovered.isFuture && (
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-dark-900 border border-dark-700 rounded-lg p-3 shadow-xl z-50 min-w-44">
                    <p className="font-medium text-dark-100 text-sm">
                        {hovered.displayDate}
                        {hovered.isToday && ' (Today)'}
                    </p>
                    {hovered.questions > 0 ? (
                        <div className="mt-1 text-xs text-dark-400">
                            <p>{hovered.questions} questions answered</p>
                            <p>{hovered.correct} correct ({hovered.accuracy}%)</p>
                        </div>
                    ) : (
                        <p className="mt-1 text-xs text-dark-500">No activity</p>
                    )}
                </div>
            )}
        </div>
    )
}
