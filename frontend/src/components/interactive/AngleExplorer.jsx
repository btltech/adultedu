import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

/**
 * AngleExplorer - Interactive component to explore and measure angles
 * User drags to change the angle
 */
export default function AngleExplorer({
    initialAngle = 45,
    onAngleChange,
    showValue = true,
    allowInteraction = true,
    size = 200,
}) {
    const [angle, setAngle] = useState(initialAngle)
    const [isDragging, setIsDragging] = useState(false)
    const containerRef = useRef(null)

    const center = size / 2
    const radius = size / 2 - 20

    const handleInteraction = (e) => {
        if (!allowInteraction) return

        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return

        const clientX = e.touches ? e.touches[0].clientX : e.clientX
        const clientY = e.touches ? e.touches[0].clientY : e.clientY

        const x = clientX - rect.left - center
        const y = -(clientY - rect.top - center) // Flip Y for math coords

        let newAngle = Math.atan2(y, x) * (180 / Math.PI)
        if (newAngle < 0) newAngle += 360

        // Snap to common angles when close
        const snapAngles = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360]
        for (const snap of snapAngles) {
            if (Math.abs(newAngle - snap) < 5) {
                newAngle = snap === 360 ? 0 : snap
                break
            }
        }

        setAngle(Math.round(newAngle))
        onAngleChange?.(Math.round(newAngle))
    }

    const handleMouseDown = (e) => {
        if (!allowInteraction) return
        setIsDragging(true)
        handleInteraction(e)
    }

    const handleMouseMove = (e) => {
        if (isDragging && allowInteraction) {
            handleInteraction(e)
        }
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
            window.addEventListener('touchmove', handleInteraction)
            window.addEventListener('touchend', handleMouseUp)
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
            window.removeEventListener('touchmove', handleInteraction)
            window.removeEventListener('touchend', handleMouseUp)
        }
    }, [isDragging])

    // Calculate line endpoint
    const angleRad = angle * (Math.PI / 180)
    const lineEndX = center + radius * Math.cos(angleRad)
    const lineEndY = center - radius * Math.sin(angleRad)

    // Generate arc path
    const arcRadius = radius * 0.4
    const largeArc = angle > 180 ? 1 : 0
    const arcEndX = center + arcRadius * Math.cos(angleRad)
    const arcEndY = center - arcRadius * Math.sin(angleRad)
    const arcPath = angle === 0 ? '' :
        `M ${center + arcRadius} ${center} A ${arcRadius} ${arcRadius} 0 ${largeArc} 0 ${arcEndX} ${arcEndY}`

    // Angle color based on type
    const getAngleColor = () => {
        if (angle === 90) return '#10b981' // Right angle - green
        if (angle < 90) return '#6366f1' // Acute - primary
        if (angle < 180) return '#f59e0b' // Obtuse - amber
        if (angle === 180) return '#ef4444' // Straight - red
        return '#8b5cf6' // Reflex - purple
    }

    const getAngleType = () => {
        if (angle === 0 || angle === 360) return 'Zero'
        if (angle < 90) return 'Acute'
        if (angle === 90) return 'Right'
        if (angle < 180) return 'Obtuse'
        if (angle === 180) return 'Straight'
        if (angle < 360) return 'Reflex'
        return ''
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <div
                ref={containerRef}
                className={`relative bg-dark-900 rounded-2xl border border-dark-700 ${allowInteraction ? 'cursor-crosshair' : ''}`}
                style={{ width: size, height: size }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleMouseDown}
            >
                <svg width={size} height={size} className="overflow-visible">
                    {/* Grid lines */}
                    <line x1={center} y1="10" x2={center} y2={size - 10} stroke="#374151" strokeWidth="1" strokeDasharray="4" />
                    <line x1="10" y1={center} x2={size - 10} y2={center} stroke="#374151" strokeWidth="1" strokeDasharray="4" />

                    {/* Circle outline */}
                    <circle cx={center} cy={center} r={radius} fill="none" stroke="#4b5563" strokeWidth="1" />

                    {/* Base line (0°) */}
                    <line
                        x1={center} y1={center}
                        x2={center + radius} y2={center}
                        stroke="#6b7280" strokeWidth="2"
                    />

                    {/* Angle arc */}
                    <path
                        d={arcPath}
                        fill="none"
                        stroke={getAngleColor()}
                        strokeWidth="3"
                        strokeLinecap="round"
                    />

                    {/* Right angle square */}
                    {angle === 90 && (
                        <rect
                            x={center}
                            y={center - 15}
                            width={15}
                            height={15}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="2"
                        />
                    )}

                    {/* Rotating line */}
                    <motion.line
                        x1={center} y1={center}
                        x2={lineEndX} y2={lineEndY}
                        stroke={getAngleColor()}
                        strokeWidth="3"
                        strokeLinecap="round"
                        initial={false}
                        animate={{ x2: lineEndX, y2: lineEndY }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    />

                    {/* Drag handle */}
                    {allowInteraction && (
                        <motion.circle
                            cx={lineEndX}
                            cy={lineEndY}
                            r={8}
                            fill={getAngleColor()}
                            stroke="white"
                            strokeWidth="2"
                            initial={false}
                            animate={{ cx: lineEndX, cy: lineEndY }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            style={{ cursor: 'grab' }}
                        />
                    )}

                    {/* Center point */}
                    <circle cx={center} cy={center} r={4} fill="#fff" />
                </svg>
            </div>

            {/* Angle display */}
            {showValue && (
                <div className="flex items-center gap-4">
                    <div
                        className="px-4 py-2 rounded-xl text-center"
                        style={{
                            backgroundColor: `${getAngleColor()}20`,
                            borderColor: `${getAngleColor()}50`,
                            borderWidth: '1px',
                        }}
                    >
                        <div className="text-3xl font-bold" style={{ color: getAngleColor() }}>
                            {angle}°
                        </div>
                        <div className="text-xs text-dark-400 mt-1">
                            {getAngleType()} Angle
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
