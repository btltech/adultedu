import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'

/**
 * MathRenderer - Renders LaTeX math expressions
 * Supports both inline and block display modes
 */
export default function MathRenderer({ expression, display = 'inline', className = '' }) {
    if (!expression) return null

    // Clean up the expression 
    const cleanExpression = expression
        .replace(/^\$\$?/, '') // Remove leading $ or $$
        .replace(/\$\$?$/, '') // Remove trailing $ or $$
        .trim()

    try {
        if (display === 'block') {
            return (
                <div className={`my-4 overflow-x-auto ${className}`}>
                    <BlockMath math={cleanExpression} />
                </div>
            )
        }
        return <InlineMath math={cleanExpression} />
    } catch (error) {
        console.error('Math rendering error:', error)
        return (
            <span className="text-red-400 font-mono text-sm">
                [Math Error: {cleanExpression}]
            </span>
        )
    }
}

/**
 * Utility to parse text containing LaTeX and render it
 * Inline math: $x^2$
 * Block math: $$\frac{a}{b}$$
 */
export function MathText({ children, className = '' }) {
    if (!children || typeof children !== 'string') return children

    // Split by $$ (block) and $ (inline)
    const parts = []
    let remaining = children
    let key = 0

    // First handle block math $$...$$
    const blockRegex = /\$\$([\s\S]*?)\$\$/g
    let lastIndex = 0

    remaining.replace(blockRegex, (match, math, offset) => {
        if (offset > lastIndex) {
            // Text before this match
            parts.push({ type: 'text', content: remaining.slice(lastIndex, offset), key: key++ })
        }
        parts.push({ type: 'block', content: math, key: key++ })
        lastIndex = offset + match.length
        return match
    })

    if (lastIndex < remaining.length) {
        remaining = remaining.slice(lastIndex)
    } else {
        remaining = ''
    }

    // Now handle inline math $...$
    if (remaining) {
        const inlineRegex = /\$(.*?)\$/g
        lastIndex = 0

        remaining.replace(inlineRegex, (match, math, offset) => {
            if (offset > lastIndex) {
                parts.push({ type: 'text', content: remaining.slice(lastIndex, offset), key: key++ })
            }
            parts.push({ type: 'inline', content: math, key: key++ })
            lastIndex = offset + match.length
            return match
        })

        if (lastIndex < remaining.length) {
            parts.push({ type: 'text', content: remaining.slice(lastIndex), key: key++ })
        }
    }

    if (parts.length === 0) return children

    return (
        <span className={className}>
            {parts.map(part => {
                if (part.type === 'text') {
                    return <span key={part.key}>{part.content}</span>
                }
                if (part.type === 'block') {
                    return <MathRenderer key={part.key} expression={part.content} display="block" />
                }
                return <MathRenderer key={part.key} expression={part.content} display="inline" />
            })}
        </span>
    )
}
