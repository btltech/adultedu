import React, { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    TouchSensor
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Individual Sortable Item Component
function SortableItem({ id, content, disabled }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`p-4 rounded-xl border border-dark-700 bg-dark-800 text-dark-200 mb-3 flex items-center gap-4 cursor-grab active:cursor-grabbing ${isDragging ? 'shadow-xl ring-2 ring-primary-500 opacity-90' : 'hover:border-dark-600'
                } ${disabled ? 'cursor-default opacity-80' : ''}`}
        >
            <div className="text-dark-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
            </div>
            <span className="flex-1 font-medium">{content}</span>
        </div>
    );
}

// Main Ordering Question Component
export default function OrderingQuestion({ question, onAnswer, showResult, result }) {
    // Determine initial items
    // If we have a result, we might want to show the correct order or the user's submitted order
    // But for simplicity, we initialize with shuffled options provided by backend
    // Or if backend provides them in a default order, we rely on that.

    const [items, setItems] = useState([]);

    useEffect(() => {
        if (question && question.options) {
            // Options is array of strings. We need unique IDs.
            // Map to { id: '0', content: '...' }
            const initialItems = question.options.map((opt, index) => ({
                id: String(index),
                content: opt
            }));

            // Shuffle so the learner has to reorder (backend stores the correct order separately).
            const shuffled = [...initialItems]
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1))
                ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
            }

            setItems(shuffled);
        }
    }, [question]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(TouchSensor), // Better mobile support
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event) => {
        if (showResult) return; // Disable dragging if result shown

        const { active, over } = event;

        if (active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);

                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    return (
        <div className="glass-card p-6">
            <div className="mb-6">
                <span className="badge badge-info mb-3">
                    Drag to Reorder • Level {question.ukLevel}
                </span>
                <p className="text-lg text-dark-100 leading-relaxed">{question.prompt}</p>
                {question.imageUrl && (
                    <div className="mt-4 rounded-xl overflow-hidden bg-dark-900/50 border border-dark-700 flex justify-center p-4">
                        <img
                            src={question.imageUrl}
                            alt="Question Diagram"
                            className="max-h-64 object-contain rounded-lg shadow-lg"
                        />
                    </div>
                )}
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={items.map(i => i.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="mb-6">
                        {items.map((item) => (
                            <SortableItem
                                key={item.id}
                                id={item.id}
                                content={item.content}
                                disabled={showResult}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {/* Answer Checking / Result Display */}
            {showResult ? (
                <div className={`p-4 rounded-xl ${result?.isCorrect
                    ? 'bg-accent-500/10 border border-accent-500/30'
                    : 'bg-amber-500/10 border border-amber-500/30'
                    }`}>
                    <div className="flex items-center gap-2 mb-2">
                        {result?.isCorrect ? (
                            <span className="text-accent-400 font-medium">✓ Correct Order!</span>
                        ) : (
                            <span className="text-amber-400 font-medium">✗ Incorrect Order</span>
                        )}
                    </div>
                    <p className="text-dark-300 text-sm">{result?.explanation}</p>
                    {/* Show correct order if wrong */}
                    {!result?.isCorrect && result?.correctAnswer && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                            <p className="text-xs text-dark-400 mb-2 uppercase tracking-wider font-bold">Correct Sequence:</p>
                            <ol className="list-decimal list-inside text-dark-300 text-sm space-y-1">
                                {(() => {
                                    const correct = result.correctAnswer

                                    if (Array.isArray(correct)) {
                                        if (correct.every((v) => typeof v === 'number')) {
                                            return correct.map((idx) => (
                                                <li key={idx}>{question.options?.[idx] ?? String(idx)}</li>
                                            ))
                                        }
                                        return correct.map((val, idx) => <li key={idx}>{String(val)}</li>)
                                    }

                                    return <li>{String(correct)}</li>
                                })()}
                            </ol>
                        </div>
                    )}
                </div>
            ) : (
                <button
                    onClick={() => {
                        // Pass current ordered content
                        onAnswer(items.map(i => i.content));
                    }}
                    className="btn-primary w-full justify-center"
                >
                    Check Order
                </button>
            )}
        </div>
    );
}
