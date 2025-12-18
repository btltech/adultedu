import React, { useState } from 'react';
import {
    DndContext,
    useSensor,
    useSensors,
    PointerSensor,
    TouchSensor,
    DragOverlay,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

// --- Draggable Label Component ---
function DraggableLabel({ id, content, isDropped }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: id,
        disabled: isDropped, // Disable if already successfully placed (optional, or just for styling)
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 100 : 1,
    };

    if (isDropped && !isDragging) {
        // If it's already dropped into a zone, we might render it differently or not render it in the source list
        // For this design, we keep it in the list but maybe greyed out if we want "use once" logic.
        // But typically getting it OUT of the list and ONTO the target is better.
        // Let's hide it from the source list if isDropped is true.
        return null;
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`
                px-4 py-2 bg-dark-800 border border-dark-600 rounded-full text-sm font-medium text-dark-200 cursor-grab active:cursor-grabbing shadow-sm hover:border-primary-500 hover:text-primary-400 transition-colors
                ${isDragging ? 'opacity-0' : 'opacity-100'} 
            `}
        >
            {content}
        </div>
    );
}

// --- Overlay Label (What you see while dragging) ---
function OverlayLabel({ content }) {
    return (
        <div className="px-4 py-2 bg-primary-600 border border-primary-400 rounded-full text-sm font-bold text-white shadow-xl cursor-grabbing">
            {content}
        </div>
    );
}

// --- Drop Zone Target Component ---
function DropZone({ id, x, y, width, height, currentLabel, isCorrect, showResult }) {
    const { setNodeRef, isOver } = useDroppable({
        id: id,
    });

    // Styles for the target box on the image
    const style = {
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: `${width}%`,
        height: `${height}%`,
        transform: 'translate(-50%, -50%)', // Center on x,y
    };

    let borderColor = 'border-white/30';
    let bgColor = 'bg-black/20';

    if (isOver) {
        borderColor = 'border-primary-400';
        bgColor = 'bg-primary-500/20';
    } else if (currentLabel) {
        // If has a label
        borderColor = 'border-primary-500';
        bgColor = 'bg-dark-900/90';

        if (showResult) {
            if (isCorrect) {
                borderColor = 'border-accent-500';
                bgColor = 'bg-accent-500/20';
            } else {
                borderColor = 'border-red-500';
                bgColor = 'bg-red-500/20';
            }
        }
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                rounded-lg border-2 border-dashed flex items-center justify-center transition-all z-10
                ${borderColor} ${bgColor}
            `}
        >
            {currentLabel ? (
                <span className={`text-xs font-bold text-center px-1 ${showResult && isCorrect ? 'text-accent-300' : 'text-white'}`}>
                    {currentLabel}
                </span>
            ) : (
                <div className="w-2 h-2 rounded-full bg-white/50" /> // Small dot to indicate center if empty
            )}
        </div>
    );
}

// --- Main Question Component ---
export default function ImageLabelQuestion({ question, onAnswer, showResult, result }) {
    // Assets parsing
    // Structure: { imageUrl, targets: [{id, x, y, w, h}], options: ["Label1", ...], answer: {targetId: "Label1"} }
    let config = { targets: [], options: [], answer: {} };
    try {
        if (question.assets) {
            config = typeof question.assets === 'string' ? JSON.parse(question.assets) : question.assets;
        }
    } catch (e) {
        console.warn('Failed to parse image label assets:', e);
    }

    // State: map targetId -> labelContent
    const [placements, setPlacements] = useState({});
    const [activeDraggable, setActiveDraggable] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor)
    );

    const handleDragStart = (event) => {
        if (showResult) return;
        const { active } = event;
        // Find content for this ID (Assuming ID is the content string itself for simplicity, OR we map it)
        // Let's assume draggable ID is `label-${content}` or just `content` if unique.
        // For simplicity, let's use the content string as ID (assuming unique labels).
        setActiveDraggable(active.id);
    };

    const handleDragEnd = (event) => {
        if (showResult) return;
        const { active, over } = event;
        setActiveDraggable(null);

        if (over && config.targets.find(t => t.id === over.id)) {
            // Dropped on a valid target
            setPlacements(prev => ({
                ...prev,
                [over.id]: active.id // Map targetId -> Label Content
            }));
        } else {
            // Dropped outside? Remove from placement if it was placed before?
            // Actually, if we drag from the "bank", it's fine.
            // If we implement dragging FROM a target to another, we'd need cleanup.
            // For MVP: Layout is Source Bank -> Targets. Once placed, it stays until overwritten or cleared (if logic allows).
            // Current logic: Source items disappear when placed. To move them, we'd need to allow dragging FROM targets.
            // MVP: Just click target to clear? Or allow dragging from target.
            // Let's keep it simple: Source list only contains unplaced items.
        }
    };

    // Helper to check if a label is placed ANYWHERE
    const isLabelPlaced = (label) => Object.values(placements).includes(label);

    const checkAnswer = () => {
        // Construct answer object: { targetId: label }
        // Verify against config.answer
        // If partials allowed? Usually all or nothing for API, but UI shows granular feedback.
        // We'll pass the whole placements object as the "answer" string/JSON.
        onAnswer(JSON.stringify(placements));
    };

    // Calculate correctness for UI display
    // We rely on `result` prop from backend usually, but for immediate UI feedback before "Next":
    // If showResult is true, we check local state against config.answer if available, or parsed result.

    return (
        <div className="glass-card p-6 select-none touch-none"> {/* touch-none prevents scrolling while dragging on mobile */}
            <div className="mb-6">
                <span className="badge badge-accent mb-3">
                    Drag & Drop Labeling • Level {question.ukLevel}
                </span>
                <p className="text-lg text-dark-100 leading-relaxed mb-4">{question.prompt}</p>
            </div>

            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                {/* Image Container with Drop Zones */}
                <div className="relative mb-8 rounded-xl overflow-hidden bg-dark-900 border border-dark-700 shadow-2xl">
                    <img
                        src={config.imageUrl || question.imageUrl}
                        alt="Diagram to label"
                        className="w-full h-auto block"
                        draggable="false"
                    />

                    {/* Render Targets */}
                    {config.targets && config.targets.map(target => (
                        <DropZone
                            key={target.id}
                            id={target.id}
                            x={target.x}
                            y={target.y}
                            width={target.width || 15}
                            height={target.height || 10}
                            currentLabel={placements[target.id]}
                            showResult={showResult}
                            isCorrect={
                                showResult &&
                                config.answer &&
                                config.answer[target.id] === placements[target.id]
                            }
                        />
                    ))}
                </div>

                {/* Source Label Bank */}
                {!showResult && (
                    <div className="flex flex-wrap gap-3 justify-center p-4 bg-dark-800/50 rounded-xl border border-dashed border-dark-700 min-h-[80px]">
                        {config.options && config.options.map((label) => (
                            <DraggableLabel
                                key={label}
                                id={label}
                                content={label}
                                isDropped={isLabelPlaced(label)}
                            />
                        ))}
                        {config.options && config.options.every(isLabelPlaced) && (
                            <span className="text-dark-500 italic text-sm py-2">All labels placed</span>
                        )}
                    </div>
                )}

                {/* Drag Overlay for smooth visuals */}
                <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
                    {activeDraggable ? <OverlayLabel content={activeDraggable} /> : null}
                </DragOverlay>

            </DndContext>

            {/* Answer Checking / Result Display */}
            {showResult ? (
                <div className={`mt-6 p-4 rounded-xl ${result?.isCorrect
                    ? 'bg-accent-500/10 border border-accent-500/30'
                    : 'bg-amber-500/10 border border-amber-500/30'
                    }`}>
                    <div className="flex items-center gap-2 mb-2">
                        {result?.isCorrect ? (
                            <span className="text-accent-400 font-medium">✓ Correct Labels!</span>
                        ) : (
                            <span className="text-amber-400 font-medium">✗ Some labels are incorrect</span>
                        )}
                    </div>
                    <p className="text-dark-300 text-sm opacity-90">{result?.explanation}</p>
                </div>
            ) : (
                <button
                    onClick={checkAnswer}
                    // Disable if not all targets filled? Or allow partial attempts.
                    // Let's require at least one placement.
                    disabled={Object.keys(placements).length === 0}
                    className="mt-6 btn-primary w-full justify-center"
                >
                    Check Labels
                </button>
            )}
        </div>
    );
}
