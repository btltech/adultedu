import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpenCheck, CheckCircle2, Clock3, GraduationCap, Lightbulb, ListChecks, Mic, NotebookPen, Play, Square, Target, Trash2, TriangleAlert } from 'lucide-react'
import { api, getUserMessage } from '../lib/api'
import LearningPathPanel from '../components/LearningPathPanel'
import NotFound from './NotFound'
import { getLessonWidget } from '../components/lesson/widgets'
import { usePageSeo } from '../components/SEO'
import { lessonSeoTags } from '../lib/seo/meta'

function WritingActivity({ block, activityId }) {
    const [response, setResponse] = useState('')
    const [checkedItems, setCheckedItems] = useState([])
    const checklist = Array.isArray(block.checklist) ? block.checklist : []
    const wordCount = response.trim() ? response.trim().split(/\s+/).length : 0

    function toggleChecklistItem(index) {
        setCheckedItems((current) => current.includes(index)
            ? current.filter((item) => item !== index)
            : [...current, index])
    }

    return (
        <section className="mb-8 rounded-[1.5rem] border border-primary-500/30 bg-primary-500/5 p-5 sm:p-6">
            <div className="mb-4 flex items-start gap-3">
                <NotebookPen className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-300" aria-hidden="true" />
                <div>
                    <h3 className="text-lg font-semibold text-dark-50">{block.title || 'Try it yourself'}</h3>
                    {block.wordGuide && <p className="mt-1 text-sm text-dark-400">Suggested length: {block.wordGuide}</p>}
                </div>
            </div>
            <p className="mb-4 whitespace-pre-line leading-7 text-dark-200">{block.prompt}</p>
            <label className="sr-only" htmlFor={`writing-activity-${activityId}`}>Your writing</label>
            <textarea
                id={`writing-activity-${activityId}`}
                value={response}
                onChange={(event) => setResponse(event.target.value)}
                placeholder="Write your response here. It stays on this page and is not submitted or marked."
                className="min-h-44 w-full resize-y rounded-xl border border-dark-700 bg-dark-950/80 px-4 py-3 leading-7 text-dark-100 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-500/30"
            />
            <p className="mt-2 text-right text-xs text-dark-500">{wordCount} words</p>
            {checklist.length > 0 && (
                <fieldset className="mt-5 border-t border-dark-700/80 pt-4">
                    <legend className="mb-3 text-sm font-semibold text-dark-100">Review your own writing</legend>
                    <div className="space-y-3">
                        {checklist.map((item, index) => (
                            <label key={item} className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-dark-300">
                                <input
                                    type="checkbox"
                                    checked={checkedItems.includes(index)}
                                    onChange={() => toggleChecklistItem(index)}
                                    className="mt-1 h-4 w-4 rounded border-dark-600 bg-dark-900 text-primary-500 focus:ring-primary-500"
                                />
                                <span>{item}</span>
                            </label>
                        ))}
                    </div>
                    {checkedItems.length === checklist.length && (
                        <p className="mt-4 flex items-center gap-2 text-sm text-accent-300"><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> You have completed your self-review.</p>
                    )}
                </fieldset>
            )}
        </section>
    )
}

function ImageInferenceActivity({ block, activityId }) {
    const [selected, setSelected] = useState(null)
    const [checked, setChecked] = useState(false)
    const options = Array.isArray(block.options) ? block.options : []
    const correctIndex = Number.isInteger(block.correctIndex) ? block.correctIndex : null
    const isCorrect = checked && selected === correctIndex

    return (
        <section className="mb-8 rounded-[1.5rem] border border-accent-500/30 bg-accent-500/5 p-5 sm:p-6">
            <div className="mb-4 flex items-start gap-3">
                <BookOpenCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-300" aria-hidden="true" />
                <div>
                    <h3 className="text-lg font-semibold text-dark-50">{block.title || 'Read the image'}</h3>
                    <p className="mt-1 text-sm text-dark-400">Use the visual and the accompanying text.</p>
                </div>
            </div>
            <figure className="mb-5 overflow-hidden rounded-xl border border-dark-700 bg-dark-950/80 p-3">
                <img src={block.imageSrc} alt={block.imageAlt || ''} className="mx-auto max-h-96 w-full rounded-lg object-contain" />
                {block.imageAlt && <figcaption className="mt-3 text-sm leading-6 text-dark-400">Image description: {block.imageAlt}</figcaption>}
            </figure>
            {block.supportingText && <p className="mb-4 rounded-xl bg-dark-900/70 p-4 leading-7 text-dark-200">{block.supportingText}</p>}
            <p className="mb-4 font-medium leading-7 text-dark-100">{block.prompt}</p>
            <div className="space-y-3" role="radiogroup" aria-label={block.prompt}>
                {options.map((option, index) => (
                    <button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={selected === index}
                        disabled={checked}
                        onClick={() => setSelected(index)}
                        className={`w-full rounded-xl border p-4 text-left text-sm leading-6 transition ${selected === index
                            ? 'border-accent-400 bg-accent-500/15 text-dark-50'
                            : 'border-dark-700 bg-dark-900/60 text-dark-200 hover:border-dark-500'} ${checked && index === correctIndex ? 'border-accent-400 bg-accent-500/15' : ''}`}
                    >
                        <span className="mr-3 font-semibold text-accent-300">{String.fromCharCode(65 + index)}.</span>{option}
                    </button>
                ))}
            </div>
            {!checked ? (
                <button type="button" className="btn-primary mt-5" disabled={selected === null} onClick={() => setChecked(true)}>Check answer</button>
            ) : (
                <div className={`mt-5 rounded-xl border p-4 ${isCorrect ? 'border-accent-500/30 bg-accent-500/10' : 'border-amber-500/30 bg-amber-500/10'}`} aria-live="polite">
                    <p className="font-semibold text-dark-50">{isCorrect ? 'Correct' : `The best answer is ${String.fromCharCode(65 + correctIndex)}.`}</p>
                    {block.explanation && <p className="mt-2 text-sm leading-6 text-dark-200">{block.explanation}</p>}
                </div>
            )}
        </section>
    )
}

function SpeakingActivity({ block, activityId }) {
    const [isRecording, setIsRecording] = useState(false)
    const [recordingUrl, setRecordingUrl] = useState(null)
    const [recordingError, setRecordingError] = useState(null)
    const [checkedItems, setCheckedItems] = useState([])
    const recorderRef = useRef(null)
    const streamRef = useRef(null)
    const recordingUrlRef = useRef(null)
    const checklist = Array.isArray(block.checklist) ? block.checklist : []

    useEffect(() => () => {
        if (recordingUrlRef.current) URL.revokeObjectURL(recordingUrlRef.current)
        streamRef.current?.getTracks().forEach((track) => track.stop())
    }, [])

    function stopStream() {
        streamRef.current?.getTracks().forEach((track) => track.stop())
        streamRef.current = null
    }

    async function startRecording() {
        setRecordingError(null)
        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
            setRecordingError('Recording is not supported by this browser. You can still say your response aloud and use the checklist.')
            return
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const chunks = []
            const recorder = new MediaRecorder(stream)
            streamRef.current = stream
            recorderRef.current = recorder
            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) chunks.push(event.data)
            }
            recorder.onstop = () => {
                stopStream()
                if (chunks.length > 0) {
                    if (recordingUrlRef.current) URL.revokeObjectURL(recordingUrlRef.current)
                    const url = URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }))
                    recordingUrlRef.current = url
                    setRecordingUrl(url)
                }
                setIsRecording(false)
            }
            recorder.start()
            setIsRecording(true)
        } catch {
            stopStream()
            setRecordingError('We could not access your microphone. Check your browser permission, or practise aloud without recording.')
        }
    }

    function stopRecording() {
        if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    }

    function deleteRecording() {
        if (recordingUrlRef.current) URL.revokeObjectURL(recordingUrlRef.current)
        recordingUrlRef.current = null
        setRecordingUrl(null)
    }

    function toggleChecklistItem(index) {
        setCheckedItems((current) => current.includes(index)
            ? current.filter((item) => item !== index)
            : [...current, index])
    }

    return (
        <section className="mb-8 rounded-[1.5rem] border border-violet-500/30 bg-violet-500/5 p-5 sm:p-6">
            <div className="mb-4 flex items-start gap-3">
                <Mic className="mt-0.5 h-5 w-5 flex-shrink-0 text-violet-300" aria-hidden="true" />
                <div>
                    <h3 className="text-lg font-semibold text-dark-50">{block.title || 'Say it aloud'}</h3>
                    <p className="mt-1 text-sm text-dark-400">This is private practice. Your recording stays in this browser and is never uploaded or marked.</p>
                </div>
            </div>
            <p className="mb-3 whitespace-pre-line leading-7 text-dark-200">{block.prompt}</p>
            {block.timingGuide && <p className="mb-4 text-sm text-dark-400">Suggested speaking time: {block.timingGuide}</p>}
            <div className="flex flex-wrap gap-3">
                {!isRecording ? (
                    <button type="button" className="btn-primary" onClick={startRecording}><Mic className="mr-2 h-4 w-4" />Record practice</button>
                ) : (
                    <button type="button" className="btn-secondary" onClick={stopRecording}><Square className="mr-2 h-4 w-4" />Stop recording</button>
                )}
            </div>
            {recordingError && <p className="mt-3 text-sm leading-6 text-amber-300" role="status">{recordingError}</p>}
            {recordingUrl && (
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-dark-700 bg-dark-950/70 p-3">
                    <Play className="h-4 w-4 text-violet-300" aria-hidden="true" />
                    <audio className="min-w-0 flex-1" controls src={recordingUrl}>Your browser cannot play this recording.</audio>
                    <button type="button" className="btn-secondary px-3 py-2 text-sm" onClick={deleteRecording}><Trash2 className="mr-2 h-4 w-4" />Delete</button>
                </div>
            )}
            {checklist.length > 0 && (
                <fieldset className="mt-5 border-t border-dark-700/80 pt-4">
                    <legend className="mb-3 text-sm font-semibold text-dark-100">Review your spoken response</legend>
                    <div className="space-y-3">
                        {checklist.map((item, index) => (
                            <label key={item} className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-dark-300">
                                <input type="checkbox" checked={checkedItems.includes(index)} onChange={() => toggleChecklistItem(index)} className="mt-1 h-4 w-4 rounded border-dark-600 bg-dark-900 text-violet-500 focus:ring-violet-500" />
                                <span>{item}</span>
                            </label>
                        ))}
                    </div>
                </fieldset>
            )}
        </section>
    )
}

export default function Lesson() {
    const { id } = useParams()
    const [lesson, setLesson] = useState(null)
    const [loading, setLoading] = useState(true)
    const [missing, setMissing] = useState(false)
    const [loadError, setLoadError] = useState(null)

    usePageSeo(lessonSeoTags(lesson))

    useEffect(() => {
        async function fetchLesson() {
            setLoading(true)
            setMissing(false)
            setLoadError(null)

            try {
                const data = await api(`/lessons/${id}`)
                setLesson(data)
            } catch (err) {
                console.error('Failed to load lesson:', err)
                // Only a 404 means the lesson is genuinely gone. Treating a
                // network or server failure the same way would tell crawlers a
                // real lesson had been removed during a temporary outage.
                if (err.status === 404) setMissing(true)
                else setLoadError(getUserMessage(err, "We couldn't load this lesson."))
            } finally {
                setLoading(false)
            }
        }
        fetchLesson()
    }, [id])

    if (loading) {
        return (
            <div className="py-12">
                <div className="container-app max-w-4xl">
                    <div className="skeleton h-8 w-64 mb-4" />
                    <div className="skeleton h-96 w-full" />
                </div>
            </div>
        )
    }

    if (missing) return <NotFound />

    if (!lesson) {
        return (
            <div className="py-12">
                <div className="container-app max-w-4xl text-center">
                    <h1 className="text-2xl font-bold text-dark-50 mb-4">We couldn't load this lesson</h1>
                    <p className="mx-auto mb-6 max-w-md text-sm leading-7 text-dark-300">
                        {loadError || 'Something went wrong. Please try again.'}
                    </p>
                    <Link to="/tracks" className="btn-primary">Browse pathways</Link>
                </div>
            </div>
        )
    }

    const contentBlocks = lesson.contentBlocks || []
    const readingSections = contentBlocks.filter((block) => block.type === 'heading' || block.type === 'subheading').length
    const lessonPathItems = (lesson.topic.lessons || []).map((entry) => ({
        id: entry.id,
        title: entry.title,
        meta: `${entry.estMinutes || 0} min lesson`,
    }))

    const renderBlock = (block, index) => {
        switch (block.type) {
            case 'heading':
                return <h2 key={index} className="lesson-block-heading">{block.content}</h2>
            case 'subheading':
                return <h3 key={index} className="lesson-block-subheading">{block.content}</h3>
            case 'paragraph':
                return <p key={index} className="mb-5 text-base leading-8 text-dark-300">{block.content}</p>
            case 'list':
                return (
                    <ul key={index} className="mb-6 ml-1 space-y-3 text-dark-300">
                        {(block.items || []).map((item, i) => (
                            <li key={i} className="flex gap-3 leading-7">
                                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                )
            case 'code':
                return (
                    <pre key={index} className="mb-6 overflow-x-auto rounded-[1.5rem] border border-dark-800/80 bg-dark-950/95 p-5 text-sm shadow-lg">
                        <code className="text-sm text-dark-200">{block.content}</code>
                    </pre>
                )
            case 'callout':
                {
                    const calloutStyles = block.variant === 'tip'
                        ? {
                            className: 'lesson-callout border-accent-500/30 bg-accent-500/10',
                            icon: <Lightbulb className="h-4 w-4 text-accent-300" />,
                            label: 'Tip',
                        }
                        : block.variant === 'warning'
                            ? {
                                className: 'lesson-callout border-amber-500/30 bg-amber-500/10',
                                icon: <TriangleAlert className="h-4 w-4 text-amber-300" />,
                                label: 'Watch for this',
                            }
                            : {
                                className: 'lesson-callout border-primary-500/30 bg-primary-500/10',
                                icon: <NotebookPen className="h-4 w-4 text-primary-300" />,
                                label: 'Key idea',
                            }

                    return (
                        <div key={index} className={calloutStyles.className}>
                            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-dark-100">
                                {calloutStyles.icon}
                                {calloutStyles.label}
                            </div>
                            <p className="text-dark-200 leading-7">{block.content}</p>
                        </div>
                    )
                }
            case 'interactive': {
                const Widget = getLessonWidget(block.widget)
                // An unrecognised widget name should cost the learner nothing.
                return Widget ? <Widget key={index} block={block} /> : null
            }
            case 'writing_activity':
                return <WritingActivity key={index} block={block} activityId={index} />
            case 'image_inference_activity':
                return <ImageInferenceActivity key={index} block={block} activityId={index} />
            case 'speaking_activity':
                return <SpeakingActivity key={index} block={block} activityId={index} />
            default:
                return <p key={index} className="mb-5 text-base leading-8 text-dark-300">{block.content || JSON.stringify(block)}</p>
        }
    }

    return (
        <div className="section-padding animate-fade-slide-up">
            <div className="container-app max-w-6xl">
                <nav className="mb-6 text-sm">
                    <Link to={`/track/${lesson.track.slug}`} className="text-dark-400 hover:text-dark-200">
                        {lesson.track.title}
                    </Link>
                    <span className="mx-2 text-dark-600">/</span>
                    <Link to={`/topic/${lesson.topic.id}`} className="text-dark-400 hover:text-dark-200">
                        {lesson.topic.title}
                    </Link>
                    <span className="mx-2 text-dark-600">/</span>
                    <span className="text-dark-200">{lesson.title}</span>
                </nav>

                <section className="marketing-shell mb-8 px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)] lg:items-start">
                        <div>
                            <span className="section-eyebrow">
                                <GraduationCap className="h-3.5 w-3.5" />
                                Guided lesson
                            </span>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                <span className="badge badge-primary">{lesson.topic.ukLevel}</span>
                                <span className="badge badge-neutral">{lesson.topic.title}</span>
                            </div>

                            <h1 className="mt-4 text-3xl font-bold text-dark-50 sm:text-4xl lg:text-5xl">
                                {lesson.title}
                            </h1>
                            {lesson.summary && (
                                <p className="mt-4 max-w-3xl text-lg leading-8 text-dark-300">{lesson.summary}</p>
                            )}

                            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <div className="learning-stat">
                                    <p className="learning-stat-label">Reading time</p>
                                    <p className="learning-stat-value">{lesson.estMinutes || 0}m</p>
                                    <p className="mt-2 flex items-center gap-2 text-sm text-dark-400"><Clock3 className="h-4 w-4 text-accent-300" /> Estimated pace</p>
                                </div>
                                <div className="learning-stat">
                                    <p className="learning-stat-label">Content blocks</p>
                                    <p className="learning-stat-value">{contentBlocks.length}</p>
                                    <p className="mt-2 text-sm text-dark-400">Structured reading units</p>
                                </div>
                                <div className="learning-stat">
                                    <p className="learning-stat-label">Sections</p>
                                    <p className="learning-stat-value">{readingSections}</p>
                                    <p className="mt-2 text-sm text-dark-400">Headings and subheadings</p>
                                </div>
                                <div className="learning-stat">
                                    <p className="learning-stat-label">Next step</p>
                                    <p className="learning-stat-value">Practice</p>
                                    <p className="mt-2 text-sm text-dark-400">Apply the lesson immediately</p>
                                </div>
                            </div>
                        </div>

                        <div className="editorial-panel p-6 lg:p-7">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-300">Study approach</p>
                            <h2 className="mt-3 text-2xl font-semibold text-dark-50">Read for understanding, then switch into retrieval.</h2>
                            <div className="mt-5 space-y-3 text-sm text-dark-300">
                                <div className="editorial-subpanel p-4">
                                    <div className="flex items-start gap-3">
                                        <NotebookPen className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-300" />
                                        <div>
                                            <p className="font-semibold text-dark-100">Absorb the key idea</p>
                                            <p className="mt-1 text-dark-400">Use the headings, summaries, and callouts to focus on what matters.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="editorial-subpanel p-4">
                                    <div className="flex items-start gap-3">
                                        <ListChecks className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-300" />
                                        <div>
                                            <p className="font-semibold text-dark-100">Convert it to recall</p>
                                            <p className="mt-1 text-dark-400">Practice straight away so the lesson turns into durable memory.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-col gap-3">
                                <Link to={`/practice/${lesson.topic.id}`} className="btn-primary w-full justify-center">
                                    Practice this topic
                                    <Target className="h-4 w-4" />
                                </Link>
                                <Link to={`/topic/${lesson.topic.id}`} className="btn-ghost w-full justify-center">
                                    Back to topic
                                    <ArrowLeft className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
                    {/* min-w-0: a grid item defaults to min-width:auto and refuses to
                        shrink below its content, pushing lesson text ~14px past the
                        viewport on narrow phones where it is then clipped by the
                        layout's overflow-x-hidden. The xl track uses minmax(0,…) for
                        the same reason. */}
                    <section className="lesson-content-shell min-w-0">
                        {contentBlocks.length > 0 ? (
                            contentBlocks.map(renderBlock)
                        ) : (
                            <div className="py-12 text-center">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-500/12 text-primary-300">
                                    <BookOpenCheck className="h-7 w-7" />
                                </div>
                                <h2 className="mt-6 text-xl font-semibold text-dark-200 mb-4">Content Coming Soon</h2>
                                <p className="text-dark-400">This lesson is being developed. Check back soon!</p>
                            </div>
                        )}
                    </section>

                    <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
                        <LearningPathPanel
                            eyebrow="Topic map"
                            title="Keep your place in the sequence"
                            description="Move through the topic in order, or jump back to earlier lessons if you need a refresher."
                            items={lessonPathItems}
                            currentId={lesson.id}
                            getHref={(entry) => `/lesson/${entry.id}`}
                        />

                        <div className="progress-panel">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-300">Lesson at a glance</p>
                            <div className="mt-4 space-y-4">
                                <div className="flex items-start gap-3">
                                    <Clock3 className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-300" />
                                    <div>
                                        <p className="font-semibold text-dark-100">{lesson.estMinutes || 0} minute read</p>
                                        <p className="mt-1 text-sm text-dark-400">Designed to fit a focused study session.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <NotebookPen className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-300" />
                                    <div>
                                        <p className="font-semibold text-dark-100">{contentBlocks.length} content blocks</p>
                                        <p className="mt-1 text-sm text-dark-400">Headings, notes, and examples arranged for faster scanning.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Target className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-300" />
                                    <div>
                                        <p className="font-semibold text-dark-100">Follow with practice</p>
                                        <p className="mt-1 text-sm text-dark-400">The best time to test recall is immediately after reading.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="progress-panel">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">Navigation</p>
                            <div className="mt-4 flex flex-col gap-3">
                                {lesson.topic.previousLesson && (
                                    <Link to={`/lesson/${lesson.topic.previousLesson.id}`} className="btn-secondary w-full justify-center">
                                        <ArrowLeft className="h-4 w-4" />
                                        Previous lesson
                                    </Link>
                                )}
                                {lesson.topic.nextLesson && (
                                    <Link to={`/lesson/${lesson.topic.nextLesson.id}`} className="btn-secondary w-full justify-center">
                                        Next lesson
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                )}
                                <Link to={`/topic/${lesson.topic.id}`} className="btn-secondary w-full justify-center">
                                    Topic overview
                                </Link>
                                <Link to={`/practice/${lesson.topic.id}`} className="btn-primary w-full justify-center">
                                    Practice questions
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </aside>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Link to={`/topic/${lesson.topic.id}`} className="btn-ghost">
                            <ArrowLeft className="h-4 w-4" />
                            Back to topic
                        </Link>
                        {lesson.topic.previousLesson && (
                            <Link to={`/lesson/${lesson.topic.previousLesson.id}`} className="btn-secondary">
                                <ArrowLeft className="h-4 w-4" />
                                Previous lesson
                            </Link>
                        )}
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        {lesson.topic.nextLesson ? (
                            <Link to={`/lesson/${lesson.topic.nextLesson.id}`} className="btn-secondary">
                                Next lesson
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        ) : null}
                        <Link to={`/practice/${lesson.topic.id}`} className="btn-primary">
                            Practice Questions
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
