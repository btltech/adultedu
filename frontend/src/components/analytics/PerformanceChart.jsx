import { useState, useEffect } from 'react'
import { api } from '../../lib/api'

/**
 * PerformanceChart - Simple bar chart showing accuracy by topic
 * (No external chart library - pure CSS/SVG)
 */
export default function PerformanceChart() {
    const [topics, setTopics] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchTopics() {
            try {
                const data = await api('/analytics/topics')
                // Sort by accuracy descending and take top 8
                const sorted = (data.topics || [])
                    .sort((a, b) => b.accuracy - a.accuracy)
                    .slice(0, 8)
                setTopics(sorted)
            } catch (err) {
                console.log('Could not fetch topic performance:', err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchTopics()
    }, [])

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="skeleton h-8 rounded" />
                ))}
            </div>
        )
    }

    if (topics.length === 0) {
        return (
            <div className="text-center py-8 text-dark-400">
                <p>📊 No data yet</p>
                <p className="text-sm mt-1">Complete some practice to see your performance.</p>
            </div>
        )
    }

    const getBarColor = (accuracy) => {
        if (accuracy >= 80) return 'bg-accent-500'
        if (accuracy >= 60) return 'bg-primary-500'
        if (accuracy >= 40) return 'bg-amber-500'
        return 'bg-red-500'
    }

    return (
        <div className="space-y-3">
            {topics.map((topic, index) => (
                <div key={topic.id} className="group">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-dark-200 truncate max-w-[200px]" title={topic.title}>
                            {topic.title}
                        </span>
                        <span className="text-sm font-medium text-dark-300">
                            {topic.accuracy}%
                        </span>
                    </div>
                    <div className="h-3 bg-dark-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${getBarColor(topic.accuracy)}`}
                            style={{
                                width: `${topic.accuracy}%`,
                                animationDelay: `${index * 100}ms`
                            }}
                        />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-dark-500 mt-0.5">
                        <span>{topic.correct}/{topic.total} correct</span>
                        {topic.timeSpentFormatted && (
                            <span>• {topic.timeSpentFormatted} spent</span>
                        )}
                    </div>
                </div>
            ))}

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-dark-800">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-accent-500" />
                    <span className="text-xs text-dark-400">80%+</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-primary-500" />
                    <span className="text-xs text-dark-400">60-79%</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-amber-500" />
                    <span className="text-xs text-dark-400">40-59%</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-red-500" />
                    <span className="text-xs text-dark-400">&lt;40%</span>
                </div>
            </div>
        </div>
    )
}
