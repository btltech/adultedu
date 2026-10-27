import { useEffect, useState } from 'react'
import { Headphones, Pause, Play, Square } from 'lucide-react'
import {
    getReadAloudState,
    isReadAloudSupported,
    pauseReadAloud,
    readAloud,
    resumeReadAloud,
    stopReadAloud,
    subscribeReadAloud,
} from '../lib/speech/readAloud'
import { lessonToSentences } from '../lib/speech/speakable'

// "Listen to this lesson": reads the lesson aloud with Play / Pause / Stop controls.
export default function ListenButton({ lesson }) {
    const [state, setState] = useState(getReadAloudState())

    useEffect(() => subscribeReadAloud(setState), [])
    // Stop speaking when the learner leaves the lesson.
    useEffect(() => () => stopReadAloud(), [lesson?.id])

    if (!isReadAloudSupported()) return null

    const sentences = lessonToSentences(lesson)
    if (!sentences.length) return null

    const { status, index, total } = state

    return (
        <div className="mt-5 flex flex-wrap items-center gap-3" role="group" aria-label="Listen to this lesson">
            {status === 'idle' ? (
                <button type="button" onClick={() => readAloud(sentences)} className="btn-secondary inline-flex items-center gap-2">
                    <Headphones className="h-4 w-4" aria-hidden="true" />
                    Listen to this lesson
                </button>
            ) : (
                <>
                    <button
                        type="button"
                        onClick={status === 'paused' ? resumeReadAloud : pauseReadAloud}
                        className="btn-secondary inline-flex items-center gap-2"
                    >
                        {status === 'paused'
                            ? <Play className="h-4 w-4" aria-hidden="true" />
                            : <Pause className="h-4 w-4" aria-hidden="true" />}
                        {status === 'paused' ? 'Resume' : 'Pause'}
                    </button>
                    <button type="button" onClick={stopReadAloud} className="btn-secondary inline-flex items-center gap-2">
                        <Square className="h-4 w-4" aria-hidden="true" />
                        Stop
                    </button>
                </>
            )}
            <span className="text-sm text-dark-400" role="status" aria-live="polite">
                {status === 'idle' ? '' : `${status === 'paused' ? 'Paused' : 'Reading'}: ${Math.min(index + 1, total)} of ${total}`}
            </span>
        </div>
    )
}
