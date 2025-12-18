
import { useEffect, useState, useRef } from 'react'
import api, { getTracks } from '../../lib/api'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
    Filter,
    Layers,
    Search,
    Plus,
    ChevronRight,
    FileText,
    MoreVertical,
    Trash2,
    Edit3,
    Upload,
    Download,
    CheckSquare,
    Square,
    X
} from 'lucide-react'

export default function ContentManager() {
    // Data State
    const [questions, setQuestions] = useState([])
    const [tracks, setTracks] = useState([])
    const [loading, setLoading] = useState(true)

    // Filter State
    const [selectedTrack, setSelectedTrack] = useState(null)
    const [selectedTopic, setSelectedTopic] = useState(null)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    // Bulk Selection State
    const [selectedIds, setSelectedIds] = useState(new Set())
    const [showImportModal, setShowImportModal] = useState(false)
    const [importing, setImporting] = useState(false)
    const fileInputRef = useRef(null)

    // Initial Load
    useEffect(() => {
        async function loadTracks() {
            try {
                const data = await getTracks()
                setTracks(data)
            } catch (err) {
                console.error('Failed to fetch tracks:', err)
            }
        }
        loadTracks()
    }, [])

    // Fetch Questions
    const fetchQuestions = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page,
                limit: 15,
                search,
                type: typeFilter,
                status: statusFilter === 'all' ? '' : statusFilter,
                trackId: selectedTrack ? selectedTrack.id : '',
                topicId: selectedTopic ? selectedTopic.id : ''
            })
            const data = await api.get(`/admin/questions?${params}`)
            setQuestions(data.questions)
            setTotalPages(data.pagination.pages)
        } catch (err) {
            console.error('Failed to fetch questions:', err)
        } finally {
            setLoading(false)
        }
    }

    // Debounce fetch
    useEffect(() => {
        const timeout = setTimeout(fetchQuestions, 300)
        return () => clearTimeout(timeout)
    }, [page, search, typeFilter, statusFilter, selectedTrack, selectedTopic])

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this question?')) return
        try {
            await api.delete(`/admin/questions/${id}`)
            fetchQuestions()
        } catch (err) {
            alert('Failed to delete question')
        }
    }

    const handleTrackSelect = (track) => {
        setSelectedTrack(track)
        setSelectedTopic(null)
        setPage(1)
    }

    const handleTopicSelect = (topic, track) => {
        setSelectedTrack(track) // Ensure track is parent
        setSelectedTopic(topic)
        setPage(1)
    }

    const resetFilters = () => {
        setSelectedTrack(null)
        setSelectedTopic(null)
        setPage(1)
    }

    // Bulk Selection Handlers
    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const toggleSelectAll = () => {
        if (selectedIds.size === questions.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(questions.map(q => q.id)))
        }
    }

    const clearSelection = () => setSelectedIds(new Set())

    // Bulk Delete
    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedIds.size} questions? This cannot be undone.`)) return
        try {
            await api.delete('/admin/bulk/delete', { body: { ids: [...selectedIds] } })
            toast.success(`Deleted ${selectedIds.size} questions`)
            clearSelection()
            fetchQuestions()
        } catch (err) {
            toast.error('Bulk delete failed')
        }
    }

    // Bulk Toggle Publish
    const handleBulkPublish = async (publish) => {
        try {
            await api.put('/admin/bulk/update', {
                body: { ids: [...selectedIds], updates: { isPublished: publish } }
            })
            toast.success(`Updated ${selectedIds.size} questions`)
            clearSelection()
            fetchQuestions()
        } catch (err) {
            toast.error('Bulk update failed')
        }
    }

    // Export
    const handleExport = async () => {
        try {
            const params = new URLSearchParams({
                trackId: selectedTrack?.id || '',
                topicId: selectedTopic?.id || '',
                isPublished: statusFilter === 'published' ? 'true' : statusFilter === 'draft' ? 'false' : ''
            })
            const data = await api.get(`/admin/bulk/export?${params}`)
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `questions-export-${new Date().toISOString().split('T')[0]}.json`
            a.click()
            URL.revokeObjectURL(url)
            toast.success(`Exported ${data.count} questions`)
        } catch (err) {
            toast.error('Export failed')
        }
    }

    // Import
    const handleImportFile = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setImporting(true)
        try {
            const text = await file.text()
            const data = JSON.parse(text)
            const questions = Array.isArray(data) ? data : data.questions
            if (!questions) throw new Error('Invalid format')

            const result = await api.post('/admin/bulk/import', { body: { questions } })
            toast.success(`Imported ${result.imported} questions${result.failed ? `, ${result.failed} failed` : ''}`)
            setShowImportModal(false)
            fetchQuestions()
        } catch (err) {
            toast.error(err.message || 'Import failed')
        } finally {
            setImporting(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    return (
        <div className="animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Sidebar Filters */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="solid-card p-4">
                        <button
                            onClick={resetFilters}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${!selectedTrack ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30' : 'text-dark-300 hover:bg-dark-700/50'}`}
                        >
                            <Layers size={18} />
                            <span className="font-medium">All Content</span>
                        </button>
                    </div>

                    <div className="solid-card p-4 flex flex-col gap-2 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                        <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider px-2 mb-2">By Track</h3>
                        {tracks.map(track => (
                            <div key={track.id} className="space-y-1">
                                <button
                                    onClick={() => handleTrackSelect(track)}
                                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${selectedTrack?.id === track.id && !selectedTopic ? 'bg-dark-700 text-white' : 'text-dark-300 hover:bg-dark-700/50'}`}
                                >
                                    <span className="truncate text-sm">{track.title}</span>
                                    {selectedTrack?.id === track.id && <ChevronRight size={14} />}
                                </button>

                                {/* Nested Topics */}
                                {selectedTrack?.id === track.id && (
                                    <div className="ml-4 pl-2 border-l border-dark-700 space-y-1">
                                        {track.topics.map(topic => (
                                            <button
                                                key={topic.id}
                                                onClick={(e) => { e.stopPropagation(); handleTopicSelect(topic, track); }}
                                                className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors ${selectedTopic?.id === topic.id ? 'text-primary-400 bg-primary-500/10' : 'text-dark-400 hover:text-dark-200'}`}
                                            >
                                                {topic.title}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Header Actions */}
                    <div className="solid-card p-4 flex flex-wrap gap-4 justify-between items-center">
                        <div className="flex items-center gap-2 text-dark-300 text-sm">
                            <span className={!selectedTrack ? 'text-white font-medium' : ''}>All</span>
                            {selectedTrack && (
                                <>
                                    <ChevronRight size={14} />
                                    <span className={!selectedTopic ? 'text-white font-medium' : ''}>{selectedTrack.title}</span>
                                </>
                            )}
                            {selectedTopic && (
                                <>
                                    <ChevronRight size={14} />
                                    <span className="text-white font-medium">{selectedTopic.title}</span>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setShowImportModal(true)} className="btn-secondary px-3 py-2 text-sm flex items-center gap-2">
                                <Upload size={16} /> Import
                            </button>
                            <button onClick={handleExport} className="btn-secondary px-3 py-2 text-sm flex items-center gap-2">
                                <Download size={16} /> Export
                            </button>
                            <Link to="/admin/questions/new" className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
                                <Plus size={16} /> New Question
                            </Link>
                        </div>
                    </div>

                    {/* Bulk Action Toolbar */}
                    {selectedIds.size > 0 && (
                        <div className="solid-card p-3 flex items-center gap-4 bg-primary-500/10 border-primary-500/30">
                            <span className="text-sm text-primary-300 font-medium">
                                {selectedIds.size} selected
                            </span>
                            <button onClick={() => handleBulkPublish(true)} className="text-sm text-dark-300 hover:text-white">
                                Publish
                            </button>
                            <button onClick={() => handleBulkPublish(false)} className="text-sm text-dark-300 hover:text-white">
                                Unpublish
                            </button>
                            <button onClick={handleBulkDelete} className="text-sm text-red-400 hover:text-red-300">
                                Delete
                            </button>
                            <button onClick={clearSelection} className="ml-auto text-dark-400 hover:text-white">
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {/* Filter Bar */}
                    <div className="solid-card p-4 flex flex-wrap gap-4 items-center">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search questions..."
                                className="input pl-10 py-2 text-sm"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                aria-label="Search Questions"
                            />
                        </div>

                        <div className="flex gap-2 bg-dark-900/50 p-1 rounded-lg border border-dark-700">
                            {['all', 'draft', 'published'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => { setStatusFilter(tab); setPage(1) }}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${statusFilter === tab
                                        ? 'bg-dark-700 text-white shadow-sm'
                                        : 'text-dark-400 hover:text-dark-200'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <select
                            className="bg-dark-800 border border-dark-600 text-dark-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-primary-500"
                            value={typeFilter}
                            onChange={e => setTypeFilter(e.target.value)}
                            aria-label="Filter by Type"
                        >
                            <option value="">All Types</option>
                            <option value="mcq">MCQ</option>
                            <option value="true_false">True/False</option>
                        </select>
                    </div>

                    {/* Questions Table */}
                    <div className="solid-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-dark-900/50 text-dark-400 text-xs uppercase font-medium border-b border-dark-700">
                                    <tr>
                                        <th className="p-4 w-10">
                                            <button onClick={toggleSelectAll} className="text-dark-400 hover:text-white">
                                                {selectedIds.size === questions.length && questions.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                                            </button>
                                        </th>
                                        <th className="p-4 w-[35%]">Prompt</th>
                                        <th className="p-4">Type</th>
                                        <th className="p-4">Level</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-dark-700/50">
                                    {loading ? (
                                        <tr><td colSpan="6" className="p-8 text-center text-dark-400">Loading questions...</td></tr>
                                    ) : questions.length === 0 ? (
                                        <tr><td colSpan="6" className="p-8 text-center text-dark-400">No questions found matching your filters.</td></tr>
                                    ) : (
                                        questions.map(q => (
                                            <tr key={q.id} className={`hover:bg-dark-700/30 transition-colors group ${selectedIds.has(q.id) ? 'bg-primary-500/5' : ''}`}>
                                                <td className="p-4">
                                                    <button onClick={() => toggleSelect(q.id)} className="text-dark-400 hover:text-white">
                                                        {selectedIds.has(q.id) ? <CheckSquare size={18} className="text-primary-400" /> : <Square size={18} />}
                                                    </button>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col">
                                                        <Link to={`/admin/questions/${q.id}`} className="text-dark-100 font-medium hover:text-primary-400 line-clamp-2 mb-1">
                                                            {q.prompt}
                                                        </Link>
                                                        <div className="flex items-center gap-2 text-xs text-dark-500">
                                                            <span>{q.topic?.track?.title}</span>
                                                            <ChevronRight size={10} />
                                                            <span>{q.topic?.title}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-xs bg-dark-700 text-dark-300 px-2 py-1 rounded capitalize border border-dark-600">
                                                        {q.type.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-xs text-dark-300 font-mono">
                                                        {q.ukLevel?.code}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${q.isPublished
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                        }`}>
                                                        {q.isPublished ? 'Published' : 'Draft'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Link
                                                            to={`/admin/questions/${q.id}`}
                                                            className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-600 rounded"
                                                            aria-label="Edit"
                                                        >
                                                            <Edit3 size={16} />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(q.id)}
                                                            className="p-1.5 text-dark-400 hover:text-red-400 hover:bg-dark-600 rounded"
                                                            aria-label="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-dark-700 flex justify-between items-center bg-dark-900/30">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                    className="px-3 py-1.5 text-sm rounded bg-dark-800 border border-dark-600 text-dark-300 hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-dark-400">Page {page} of {totalPages}</span>
                                <button
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                    className="px-3 py-1.5 text-sm rounded bg-dark-800 border border-dark-600 text-dark-300 hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/80 backdrop-blur-sm">
                    <div className="solid-card p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Import Questions</h3>
                            <button onClick={() => setShowImportModal(false)} className="text-dark-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div
                            className="border-2 border-dashed border-dark-600 rounded-xl p-8 text-center hover:border-primary-500 transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault()
                                if (e.dataTransfer.files[0]) {
                                    handleImportFile({ target: { files: e.dataTransfer.files } })
                                }
                            }}
                        >
                            <Upload className="mx-auto text-dark-400 mb-3" size={32} />
                            <p className="text-dark-300 mb-2">Drop JSON file here or click to browse</p>
                            <p className="text-dark-500 text-xs">Supports up to 500 questions per import</p>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleImportFile}
                            className="hidden"
                        />

                        {importing && (
                            <div className="mt-4 text-center text-primary-400">Importing...</div>
                        )}

                        <div className="mt-4 text-xs text-dark-500">
                            <p className="font-medium mb-1">Expected JSON format:</p>
                            <pre className="bg-dark-900 p-2 rounded text-dark-400 overflow-x-auto text-left">
                                {`{ "questions": [{ "topicId": "...", "type": "mcq", "prompt": "...", "options": [...], "answer": "A" }] }`}
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
