
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { Save, ArrowLeft, Check, AlertCircle } from 'lucide-react'

export default function QuestionEditor() {
    const { id } = useParams()
    const navigate = useNavigate()
    const isNew = !id || id === 'new'

    const [loading, setLoading] = useState(!isNew)
    const [saving, setSaving] = useState(false)
    const [tracks, setTracks] = useState([])
    const [topics, setTopics] = useState([])
    const [levels, setLevels] = useState([])
    const [error, setError] = useState(null)

    const [selectedTrack, setSelectedTrack] = useState('')

    // Form State
    const [formData, setFormData] = useState({
        topicId: '',
        ukLevelId: '',
        type: 'mcq',
        prompt: '',
        options: ['', '', '', ''],
        answer: '0',
        explanation: '',
        difficulty: 3,
        isPublished: false,
        imageUrl: '',
        assetsText: '',
        sourceMetaText: '',
        orderingText: '',
        sliderMin: '0',
        sliderMax: '100',
        sliderStep: '1',
        sliderUnit: '',
        sliderTolerance: ''
    })

    const selectedTopicData = topics.find(t => t.id === formData.topicId)

    useEffect(() => {
        const loadInitData = async () => {
            try {
                // 1. Fetch Metadata
                const [trackRes, levelRes] = await Promise.all([
                    api.get('/tracks'),
                    api.get('/uk-levels')
                ])
                setTracks(trackRes)
                setLevels(levelRes)

                // 2. Fetch Question if editing
                if (!isNew) {
                    try {
                        const q = await api.get(`/admin/questions/${id}`)

                        // Set Track first to trigger topic load
                        if (q.topic?.track?.slug) {
                            setSelectedTrack(q.topic.track.slug)
                            // We need to wait for topics to load or manually load them here
                            // Let's just fetch that specific track's topics manually to be safe
                            const trackData = await api.get(`/tracks/${q.topic.track.slug}`)
                            setTopics(trackData.topics || [])
                        }

                        // Parse fields
                        let optionsArray = []
                        if (q.options) {
                            try {
                                const parsed = JSON.parse(q.options)
                                if (Array.isArray(parsed)) optionsArray = parsed.map((o) => String(o))
                            } catch (e) { }
                        }

                        // Editor supports MCQ-like questions with 4 options. Pad/truncate if needed.
                        let parsedOptions = ['', '', '', '']
                        if (q.type === 'mcq' || q.type === 'scenario') {
                            const padded = [...optionsArray]
                            while (padded.length < 4) padded.push('')
                            parsedOptions = padded.slice(0, 4)
                        } else if (optionsArray.length > 0) {
                            parsedOptions = optionsArray
                        }

                        let answerValue = q.answer
                        if (q.answer) {
                            try { answerValue = JSON.parse(q.answer) } catch (e) { answerValue = q.answer }
                        }

                        const normalizeText = (s) => String(s ?? '').trim().toLowerCase()
                        const findOptionIndex = (opts, target) => {
                            const t = normalizeText(target)
                            if (!t) return -1
                            return opts.findIndex((o) => normalizeText(o) === t)
                        }

                        let parsedAnswer = '0'
                        if (q.type === 'true_false') {
                            const norm = normalizeText(answerValue)
                            if (answerValue === true || norm === 'true') parsedAnswer = '0'
                            else if (answerValue === false || norm === 'false') parsedAnswer = '1'
                            else if (norm === '0' || norm === '1') parsedAnswer = norm
                            else if (Number.isInteger(answerValue) && (answerValue === 0 || answerValue === 1)) parsedAnswer = String(answerValue)
                        } else if (q.type === 'mcq' || q.type === 'scenario') {
                            if (Number.isInteger(answerValue) && answerValue >= 0 && answerValue < parsedOptions.length) {
                                parsedAnswer = String(answerValue)
                            } else if (typeof answerValue === 'string') {
                                const trimmed = answerValue.trim()
                                if (/^\\d+$/.test(trimmed)) {
                                    const idx = parseInt(trimmed, 10)
                                    if (idx >= 0 && idx < parsedOptions.length) parsedAnswer = String(idx)
                                } else {
                                    const idx = findOptionIndex(parsedOptions, trimmed)
                                    if (idx >= 0) parsedAnswer = String(idx)
                                }
                            } else {
                                const idx = findOptionIndex(parsedOptions, String(answerValue))
                                if (idx >= 0) parsedAnswer = String(idx)
                            }
                        } else if (q.answer) {
                            try { parsedAnswer = JSON.parse(q.answer).toString() } catch (e) { parsedAnswer = q.answer }
                        }

                        const imageUrl = q.imageUrl || ''

                        let assetsText = ''
                        if (q.assets) {
                            try {
                                assetsText = JSON.stringify(JSON.parse(q.assets), null, 2)
                            } catch (e) {
                                assetsText = String(q.assets)
                            }
                        }

                        let sourceMetaText = ''
                        if (q.sourceMeta) {
                            try {
                                sourceMetaText = JSON.stringify(JSON.parse(q.sourceMeta), null, 2)
                            } catch (e) {
                                sourceMetaText = String(q.sourceMeta)
                            }
                        }

                        let orderingText = ''
                        if (q.type === 'ordering') {
                            const val = answerValue
                            if (Array.isArray(val)) {
                                if (val.every((v) => Number.isInteger(v))) {
                                    orderingText = val
                                        .map((idx) => optionsArray[idx])
                                        .filter((v) => typeof v === 'string' && v.trim().length > 0)
                                        .join('\n')
                                } else {
                                    orderingText = val.map((v) => String(v)).join('\n')
                                }
                            }
                            if (!orderingText && Array.isArray(optionsArray) && optionsArray.length > 0) {
                                orderingText = optionsArray.join('\n')
                            }
                        }

                        let sliderMin = '0'
                        let sliderMax = '100'
                        let sliderStep = '1'
                        let sliderUnit = ''
                        let sliderTolerance = ''
                        if (q.type === 'slider') {
                            if (optionsArray.length >= 3) {
                                sliderMin = String(optionsArray[0] ?? '0')
                                sliderMax = String(optionsArray[1] ?? '100')
                                sliderStep = String(optionsArray[2] ?? '1')
                                sliderUnit = String(optionsArray[3] ?? '')
                            }
                            try {
                                const meta = q.sourceMeta ? JSON.parse(q.sourceMeta) : {}
                                const tol = meta?.slider?.tolerance ?? meta?.sliderTolerance ?? meta?.tolerance
                                if (tol !== undefined && tol !== null && String(tol).trim() !== '') {
                                    sliderTolerance = String(tol)
                                }
                            } catch (e) { }
                        }

                        setFormData({
                            topicId: q.topicId,
                            ukLevelId: q.ukLevelId,
                            type: q.type,
                            prompt: q.prompt,
                            options: parsedOptions,
                            answer: parsedAnswer,
                            explanation: q.explanation || '',
                            difficulty: q.difficulty || 3,
                            isPublished: q.isPublished,
                            imageUrl,
                            assetsText,
                            sourceMetaText,
                            orderingText,
                            sliderMin,
                            sliderMax,
                            sliderStep,
                            sliderUnit,
                            sliderTolerance
                        })
                    } catch (err) {
                        console.error("Failed to load question:", err)
                        setError("Failed to load question data.")
                    }
                }
            } catch (err) {
                console.error(err)
                setError("Failed to load dependencies.")
            } finally {
                setLoading(false)
            }
        }
        loadInitData()
    }, [id, isNew])

    // Handle Track Change (Load Topics)
    useEffect(() => {
        if (!selectedTrack) {
            // Only clear topics if we're not in the middle of initial load
            // But initial load handles topics manually above
            if (loading) return
            setTopics([])
            return
        }
        // Only fetch if topics aren't already loaded for this track (optimization + preventing overwrite on init)
        // Actually simpler to just fetch.
        if (!loading) {
            api.get(`/tracks/${selectedTrack}`).then(t => setTopics(t.topics || []))
        }
    }, [selectedTrack, loading])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError(null)

        try {
            const trimOrNull = (val) => {
                const t = String(val ?? '').trim()
                return t.length > 0 ? t : null
            }

            const parseJsonText = (text, { allowEmpty = true } = {}) => {
                const raw = String(text ?? '').trim()
                if (!raw) {
                    if (allowEmpty) return null
                    throw new Error('Invalid JSON: value is empty')
                }
                return JSON.parse(raw)
            }

            const type = formData.type

            let optionsPayload = null
            let answerPayload = null
            let assetsPayload = null
            let sourceMetaPayload = null

            const imageUrlPayload = trimOrNull(formData.imageUrl)

            const parsedIndex = Number.parseInt(String(formData.answer), 10)

            const isScaffoldedMultiStep = (() => {
                if (type !== 'multi_step') return false
                try {
                    const assetsObj = parseJsonText(formData.assetsText)
                    return Array.isArray(assetsObj?.steps) && assetsObj.steps.length > 0
                } catch {
                    return false
                }
            })()

            if (type === 'mcq' || type === 'scenario') {
                optionsPayload = formData.options
                answerPayload = Number.isInteger(parsedIndex) ? parsedIndex : 0
            } else if (type === 'true_false') {
                optionsPayload = ['True', 'False']
                answerPayload = Number.isInteger(parsedIndex) ? parsedIndex : 0
            } else if (type === 'short_answer') {
                optionsPayload = null
                answerPayload = String(formData.answer ?? '').trim()
            } else if (type === 'ordering') {
                const items = String(formData.orderingText ?? '')
                    .split('\n')
                    .map((l) => l.trim())
                    .filter(Boolean)

                optionsPayload = items
                answerPayload = items // Store correct order as values; learner view can shuffle safely.
            } else if (type === 'slider') {
                const min = Number(String(formData.sliderMin ?? '').trim())
                const max = Number(String(formData.sliderMax ?? '').trim())
                const step = Number(String(formData.sliderStep ?? '').trim())
                const unit = String(formData.sliderUnit ?? '')

                optionsPayload = [min, max, step, unit]
                answerPayload = Number(String(formData.answer ?? '').trim())

                const existingMeta = (() => {
                    try {
                        return formData.sourceMetaText ? JSON.parse(formData.sourceMetaText) : {}
                    } catch {
                        return {}
                    }
                })()

                const tolRaw = String(formData.sliderTolerance ?? '').trim()
                if (tolRaw) {
                    const tol = Number(tolRaw)
                    if (!Number.isNaN(tol) && Number.isFinite(tol)) {
                        sourceMetaPayload = {
                            ...existingMeta,
                            slider: {
                                ...(existingMeta.slider || {}),
                                tolerance: tol,
                            },
                        }
                    }
                } else if (formData.sourceMetaText) {
                    sourceMetaPayload = existingMeta
                }
            } else if (type === 'image_label') {
                assetsPayload = parseJsonText(formData.assetsText, { allowEmpty: false })

                let answerObj = null
                try {
                    answerObj = parseJsonText(formData.answer, { allowEmpty: true })
                } catch (e) {
                    answerObj = null
                }

                if (!answerObj && assetsPayload && typeof assetsPayload === 'object' && assetsPayload.answer) {
                    answerObj = assetsPayload.answer
                }

                if (!answerObj || typeof answerObj !== 'object') {
                    throw new Error('Image label questions require an answer mapping (targetId -> label).')
                }

                answerPayload = answerObj
                optionsPayload = Array.isArray(assetsPayload?.options) ? assetsPayload.options : null
            } else if (type === 'multi_step') {
                if (isScaffoldedMultiStep) {
                    assetsPayload = parseJsonText(formData.assetsText, { allowEmpty: false })
                    optionsPayload = ['Completed']
                    answerPayload = 'Completed'
                } else {
                    optionsPayload = formData.options
                    answerPayload = Number.isInteger(parsedIndex) ? parsedIndex : 0
                    assetsPayload = null
                }
            } else {
                // Unknown/legacy types: treat as short answer
                optionsPayload = null
                answerPayload = String(formData.answer ?? '').trim()
            }

            if (!assetsPayload && formData.assetsText && String(formData.assetsText).trim()) {
                try {
                    assetsPayload = JSON.parse(String(formData.assetsText).trim())
                } catch (e) {
                    throw new Error('Assets JSON is invalid.')
                }
            }

            if (!sourceMetaPayload && formData.sourceMetaText && type !== 'slider') {
                try {
                    sourceMetaPayload = JSON.parse(formData.sourceMetaText)
                } catch (e) {
                    // ignore invalid sourceMeta JSON (validation will fail if backend enforces it)
                }
            }

            const derivedImageUrl =
                imageUrlPayload ||
                (assetsPayload && typeof assetsPayload === 'object' && assetsPayload.imageUrl
                    ? String(assetsPayload.imageUrl).trim()
                    : null)

            const payload = {
                topicId: formData.topicId,
                ukLevelId: formData.ukLevelId,
                type,
                prompt: formData.prompt,
                options: optionsPayload,
                answer: answerPayload,
                explanation: formData.explanation,
                difficulty: parseInt(formData.difficulty),
                isPublished: formData.isPublished,
                imageUrl: derivedImageUrl,
                assets: assetsPayload,
                ...(sourceMetaPayload ? { sourceMeta: sourceMetaPayload } : {}),
            }

            if (isNew) {
                await api.post('/admin/questions', payload)
            } else {
                await api.put(`/admin/questions/${id}`, payload)
            }
            navigate('/admin/content')
        } catch (err) {
            console.error(err)
            setError("Failed to save. Please check all fields.")
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
        </div>
    )

    if (error && !loading && !formData.prompt) return (
        <div className="p-8 text-center">
            <div className="text-red-400 mb-2 font-bold flex items-center justify-center gap-2">
                <AlertCircle /> Error
            </div>
            <p className="text-dark-300">{error}</p>
            <button onClick={() => navigate('/admin/content')} className="mt-4 btn-secondary">
                Back to Questions
            </button>
        </div>
    )

    const isScaffoldedMultiStep = (() => {
        if (formData.type !== 'multi_step') return false
        try {
            const assetsObj = formData.assetsText ? JSON.parse(formData.assetsText) : null
            return Array.isArray(assetsObj?.steps) && assetsObj.steps.length > 0
        } catch {
            return false
        }
    })()

    return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/admin/content')}
                    className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        {isNew ? 'Create New Question' : 'Edit Question'}
                    </h1>
                    <p className="text-dark-400 text-sm">Design feedback-rich assessment content</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* 1. Classification */}
                <div className="solid-card p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-primary-200 border-b border-white/10 pb-2 mb-4">
                        Classification
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-dark-300">Subject Track</label>
                            <select
                                className="input w-full"
                                value={selectedTrack}
                                onChange={e => setSelectedTrack(e.target.value)}
                                required
                            >
                                <option value="">Select Track...</option>
                                {tracks.map(t => <option key={t.id} value={t.slug}>{t.title}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-dark-300">Topic</label>
                            <select
                                className="input w-full"
                                value={formData.topicId}
                                onChange={e => setFormData({ ...formData, topicId: e.target.value })}
                                required
                                disabled={!selectedTrack}
                            >
                                <option value="">Select Topic...</option>
                                {topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-dark-300">Difficulty Level</label>
                            <select
                                className="input w-full"
                                value={formData.ukLevelId}
                                onChange={e => setFormData({ ...formData, ukLevelId: e.target.value })}
                                required
                            >
                                <option value="">Select Level...</option>
                                {levels.map(l => <option key={l.id} value={l.id}>{l.code}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-dark-300">Question Type</label>
                            <select
                                className="input w-full"
                                value={formData.type}
                                onChange={e => {
                                    const nextType = e.target.value
                                    setFormData(prev => {
                                        const next = { ...prev, type: nextType }

                                        if (nextType === 'true_false') {
                                            next.answer = '0'
                                            return next
                                        }

                                        if (nextType === 'mcq' || nextType === 'scenario') {
                                            const opts = Array.isArray(prev.options) ? [...prev.options] : []
                                            while (opts.length < 4) opts.push('')
                                            next.options = opts.slice(0, 4)

                                            const idx = Number.parseInt(String(prev.answer), 10)
                                            next.answer = Number.isInteger(idx) && idx >= 0 && idx < 4 ? String(idx) : '0'
                                        }

                                        if (nextType === 'short_answer') {
                                            next.answer = ''
                                        }

                                        if (nextType === 'ordering') {
                                            if (!prev.orderingText) {
                                                const fallback = Array.isArray(prev.options)
                                                    ? prev.options.map((o) => String(o).trim()).filter(Boolean).join('\n')
                                                    : ''
                                                next.orderingText = fallback
                                            }
                                        }

                                        if (nextType === 'slider') {
                                            next.sliderMin = prev.sliderMin || '0'
                                            next.sliderMax = prev.sliderMax || '100'
                                            next.sliderStep = prev.sliderStep || '1'
                                            next.sliderUnit = prev.sliderUnit || ''
                                            next.sliderTolerance = prev.sliderTolerance || ''
                                            if (!prev.answer || String(prev.answer).trim() === '') next.answer = '0'
                                        }

                                        if (nextType === 'image_label') {
                                            if (!prev.assetsText) {
                                                next.assetsText = JSON.stringify({
                                                    imageUrl: '',
                                                    targets: [{ id: 't1', x: 50, y: 50, width: 15, height: 10 }],
                                                    options: ['Label 1', 'Label 2'],
                                                    answer: { t1: 'Label 1' }
                                                }, null, 2)
                                            }
                                            if (!prev.answer || String(prev.answer).trim() === '') next.answer = '{}'
                                        }

                                        if (nextType === 'multi_step') {
                                            if (!prev.assetsText) {
                                                next.assetsText = JSON.stringify({
                                                    steps: [
                                                        {
                                                            prompt: 'Step 1: ...',
                                                            options: ['Option A', 'Option B', 'Option C', 'Option D'],
                                                            answer: 'Option A',
                                                            explanation: 'Explain why this option is correct.'
                                                        }
                                                    ]
                                                }, null, 2)
                                            }
                                        }

                                        return next
                                    })
                                }}
                            >
                                <option value="mcq">Multiple Choice</option>
                                <option value="scenario">Scenario (MCQ)</option>
                                <option value="true_false">True / False</option>
                                <option value="short_answer">Short Answer</option>
                                <option value="ordering">Ordering</option>
                                <option value="slider">Slider (Estimate)</option>
                                <option value="image_label">Image Label</option>
                                <option value="multi_step">Multi Step</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 2. Content */}
                <div className="solid-card p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-primary-200 border-b border-white/10 pb-2 mb-4">
                        Question Content
                    </h2>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-dark-300">Question Prompt</label>
                        <textarea
                            className="input w-full h-32 font-medium text-white"
                            value={formData.prompt}
                            onChange={e => setFormData({ ...formData, prompt: e.target.value })}
                            required
                            placeholder="e.g. Which of the following is a prime number?"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-dark-300">Image URL (optional)</label>
                        <input
                            type="text"
                            className="input w-full"
                            value={formData.imageUrl || ''}
                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                            placeholder="https://…"
                        />
                    </div>

                    {/* Short Answer */}
                    {formData.type === 'short_answer' && (
                        <div className="space-y-3 mt-4 bg-dark-900/30 p-4 rounded-lg border border-dark-700">
                            <label className="text-sm font-medium text-dark-300 block mb-2">Correct Answer</label>
                            <input
                                type="text"
                                className="input w-full"
                                value={formData.answer || ''}
                                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                required
                                placeholder="Enter the expected answer…"
                            />
                        </div>
                    )}

                    {/* Ordering */}
                    {formData.type === 'ordering' && (
                        <div className="space-y-3 mt-4 bg-dark-900/30 p-4 rounded-lg border border-dark-700">
                            <label className="text-sm font-medium text-dark-300 block mb-1">Items (one per line, in the correct order)</label>
                            <p className="text-xs text-dark-500 mb-2">Learners see these shuffled in Practice; the correct order is the line order here.</p>
                            <textarea
                                className="input w-full h-40 font-mono text-sm"
                                value={formData.orderingText || ''}
                                onChange={(e) => setFormData({ ...formData, orderingText: e.target.value })}
                                required
                                placeholder={"Step 1…\nStep 2…\nStep 3…"}
                            />
                        </div>
                    )}

                    {/* Slider */}
                    {formData.type === 'slider' && (
                        <div className="space-y-4 mt-4 bg-dark-900/30 p-4 rounded-lg border border-dark-700">
                            <label className="text-sm font-medium text-dark-300 block mb-1">Slider Config</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs text-dark-500">Min</label>
                                    <input
                                        type="number"
                                        className="input w-full"
                                        value={formData.sliderMin}
                                        onChange={(e) => setFormData({ ...formData, sliderMin: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-dark-500">Max</label>
                                    <input
                                        type="number"
                                        className="input w-full"
                                        value={formData.sliderMax}
                                        onChange={(e) => setFormData({ ...formData, sliderMax: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-dark-500">Step</label>
                                    <input
                                        type="number"
                                        className="input w-full"
                                        value={formData.sliderStep}
                                        onChange={(e) => setFormData({ ...formData, sliderStep: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-dark-500">Unit (optional)</label>
                                    <input
                                        type="text"
                                        className="input w-full"
                                        value={formData.sliderUnit}
                                        onChange={(e) => setFormData({ ...formData, sliderUnit: e.target.value })}
                                        placeholder="e.g. °C, %, km"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-dark-500">Tolerance (optional)</label>
                                    <input
                                        type="number"
                                        className="input w-full"
                                        value={formData.sliderTolerance}
                                        onChange={(e) => setFormData({ ...formData, sliderTolerance: e.target.value })}
                                        placeholder="e.g. 0.2"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-dark-500">Correct Value</label>
                                    <input
                                        type="number"
                                        className="input w-full"
                                        value={formData.answer}
                                        onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Image Label */}
                    {formData.type === 'image_label' && (
                        <div className="space-y-4 mt-4 bg-dark-900/30 p-4 rounded-lg border border-dark-700">
                            <label className="text-sm font-medium text-dark-300 block mb-1">Assets JSON</label>
                            <p className="text-xs text-dark-500 mb-2">Must include `imageUrl`, `targets`, `options`, and `answer`.</p>
                            <textarea
                                className="input w-full h-56 font-mono text-xs"
                                value={formData.assetsText || ''}
                                onChange={(e) => setFormData({ ...formData, assetsText: e.target.value })}
                                required
                                placeholder={'{\\n  \"imageUrl\": \"https://…\",\\n  \"targets\": [{\"id\":\"t1\",\"x\":50,\"y\":50,\"width\":15,\"height\":10}],\\n  \"options\": [\"Label 1\",\"Label 2\"],\\n  \"answer\": {\"t1\": \"Label 1\"}\\n}'}
                            />

                            <label className="text-sm font-medium text-dark-300 block mb-1">Answer Mapping JSON</label>
                            <p className="text-xs text-dark-500 mb-2">If left empty, the editor uses `assets.answer`.</p>
                            <textarea
                                className="input w-full h-28 font-mono text-xs"
                                value={formData.answer || ''}
                                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                placeholder={'{ \"t1\": \"Label 1\" }'}
                            />
                        </div>
                    )}

                    {/* Multi Step */}
                    {formData.type === 'multi_step' && (
                        <div className="space-y-4 mt-4 bg-dark-900/30 p-4 rounded-lg border border-dark-700">
                            <label className="text-sm font-medium text-dark-300 block mb-1">Multi-step Mode</label>
                            <p className="text-xs text-dark-500">
                                Provide `assets.steps` JSON to make this scaffolded; otherwise it behaves like an MCQ.
                            </p>
                            <textarea
                                className="input w-full h-56 font-mono text-xs"
                                value={formData.assetsText || ''}
                                onChange={(e) => setFormData({ ...formData, assetsText: e.target.value })}
                                placeholder={'{\\n  \"steps\": [\\n    {\\n      \"prompt\": \"Step 1: …\",\\n      \"options\": [\"A\",\"B\",\"C\",\"D\"],\\n      \"answer\": \"A\",\\n      \"explanation\": \"…\"\\n    }\\n  ]\\n}'}
                            />
                            {isScaffoldedMultiStep && (
                                <div className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded border border-emerald-500/20">
                                    Scaffolded mode enabled. Answer will be stored as "Completed".
                                </div>
                            )}
                        </div>
                    )}

                    {/* MCQ Options */}
                    {(formData.type === 'mcq' || formData.type === 'scenario' || (formData.type === 'multi_step' && !isScaffoldedMultiStep)) && (
                        <div className="space-y-4 mt-4 bg-dark-900/30 p-4 rounded-lg border border-dark-700">
                            <label className="text-sm font-medium text-dark-300 block mb-2">Answer Options</label>
                            {formData.options.map((opt, i) => (
                                <div key={i} className="flex gap-3 items-center group">
                                    <input
                                        type="radio"
                                        name="correctAnswer"
                                        checked={parseInt(formData.answer) === i}
                                        onChange={() => setFormData({ ...formData, answer: i.toString() })}
                                        className="w-4 h-4 text-primary-500 focus:ring-primary-500 bg-dark-800 border-dark-600"
                                    />
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            placeholder={`Option ${i + 1}`}
                                            className={`input w-full ${parseInt(formData.answer) === i ? 'border-primary-500/50 bg-primary-500/5' : ''}`}
                                            value={opt}
                                            onChange={e => {
                                                const newOpts = [...formData.options]
                                                newOpts[i] = e.target.value
                                                setFormData({ ...formData, options: newOpts })
                                            }}
                                            required
                                        />
                                        {parseInt(formData.answer) === i && (
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 text-xs font-bold uppercase tracking-wider">
                                                Correct Answer
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* True/False Options */}
                    {formData.type === 'true_false' && (
                        <div className="space-y-4 mt-4 bg-dark-900/30 p-4 rounded-lg border border-dark-700">
                            <label className="text-sm font-medium text-dark-300 block mb-2">Correct Answer</label>
                            <div className="flex gap-4">
                                <label className={`flex-1 p-4 rounded-lg border cursor-pointer transition-all flex items-center justify-center gap-2 ${formData.answer === '0'
                                    ? 'bg-emerald-500/20 border-emerald-500 text-white'
                                    : 'bg-dark-800 border-dark-600 text-dark-400 hover:bg-dark-700'
                                    }`}>
                                    <input
                                        type="radio"
                                        name="tfAnswer"
                                        className="hidden"
                                        checked={formData.answer === '0'}
                                        onChange={() => setFormData({ ...formData, answer: '0' })}
                                    />
                                    <Check size={18} className={formData.answer === '0' ? 'opacity-100' : 'opacity-0'} />
                                    True
                                </label>
                                <label className={`flex-1 p-4 rounded-lg border cursor-pointer transition-all flex items-center justify-center gap-2 ${formData.answer === '1'
                                    ? 'bg-red-500/20 border-red-500 text-white'
                                    : 'bg-dark-800 border-dark-600 text-dark-400 hover:bg-dark-700'
                                    }`}>
                                    <input
                                        type="radio"
                                        name="tfAnswer"
                                        className="hidden"
                                        checked={formData.answer === '1'}
                                        onChange={() => setFormData({ ...formData, answer: '1' })}
                                    />
                                    <Check size={18} className={formData.answer === '1' ? 'opacity-100' : 'opacity-0'} />
                                    False
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Feedback */}
                <div className="solid-card p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-primary-200 border-b border-white/10 pb-2 mb-4">
                        Feedback & Alignment
                    </h2>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-dark-300">Explanation </label>
                        <p className="text-xs text-dark-500 mb-1">Shown to the learner after they answer.</p>
                        <textarea
                            className="input w-full h-24"
                            value={formData.explanation}
                            onChange={e => setFormData({ ...formData, explanation: e.target.value })}
                            required
                            placeholder="Explain the reasoning behind the correct answer..."
                        />
                    </div>

                    {/* Outcomes Display */}
                    {selectedTopicData && selectedTopicData.topicOutcomes && (selectedTopicData.topicOutcomes.length > 0) && (
                        <div className="bg-slate-50 p-4 rounded border border-slate-200">
                            <h3 className="text-sm font-semibold text-slate-700 mb-2">Standards & Outcomes</h3>
                            <div className="flex flex-wrap gap-2">
                                {selectedTopicData.topicOutcomes.map((to, i) => (
                                    <div key={i} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded border border-blue-200" title={to.outcome.description}>
                                        <span className="font-bold">{to.outcome.code}</span>: {to.outcome.description}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-4 flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isPublished"
                                checked={formData.isPublished}
                                onChange={e => setFormData({ ...formData, isPublished: e.target.checked })}
                                className="w-5 h-5 rounded border-dark-600 bg-dark-800 text-emerald-500 focus:ring-emerald-500/50"
                            />
                            <label htmlFor="isPublished" className="text-sm font-medium text-white cursor-pointer select-none">
                                Publish Immediately
                            </label>
                        </div>
                        {formData.isPublished && (
                            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                Live
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/content')}
                        className="btn-secondary px-6"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="btn-primary px-8 flex items-center gap-2"
                    >
                        {saving ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save size={18} />
                        )}
                        {saving ? 'Saving...' : 'Save Question'}
                    </button>
                </div>

            </form>
        </div>
    )
}
