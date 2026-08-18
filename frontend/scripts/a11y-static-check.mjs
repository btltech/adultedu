import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const root = join(process.cwd(), 'src')
const files = []

async function collect(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name)
        if (entry.isDirectory()) await collect(path)
        else if (/\.(jsx|js)$/.test(entry.name)) files.push(path)
    }
}

await collect(root)

const errors = []
const warnings = []

for (const file of files) {
    const source = await readFile(file, 'utf8')
    const name = relative(process.cwd(), file)

    for (const match of source.matchAll(/<img\b[^>]*>/g)) {
        if (!/\balt\s*=/.test(match[0])) {
            errors.push(`${name}: image is missing an alt attribute`)
        }
    }

    for (const match of source.matchAll(/<input\b[\s\S]*?\/>/g)) {
        const inputStart = match.index ?? 0
        const beforeInput = source.slice(0, inputStart)
        const wrappedByLabel = beforeInput.lastIndexOf('<label') > beforeInput.lastIndexOf('</label>')
        if (wrappedByLabel) continue
        if (!/\b(?:aria-label|aria-labelledby|id)\s*=/.test(match[0])) {
            warnings.push(`${name}: input may not have a programmatic label`)
        }
    }

    for (const match of source.matchAll(/<([a-z]+)\b[\s\S]*?>/g)) {
        const tag = match[1]
        const openingTag = match[0]
        if (tag === 'button' && !/\btype\s*=/.test(openingTag)) {
            warnings.push(`${name}: button has no explicit type`)
        }
    }

    for (const match of source.matchAll(/<[^>]*role=["']dialog["'][^>]*>/g)) {
        if (!/aria-modal=["']true["']/.test(match[0])) {
            errors.push(`${name}: dialog is missing aria-modal="true"`)
        }
    }
}

if (warnings.length) {
    console.warn(`Accessibility static check: ${warnings.length} advisory warning(s)`)
    for (const warning of warnings.slice(0, 20)) console.warn(`  ${warning}`)
    if (warnings.length > 20) console.warn(`  …and ${warnings.length - 20} more`)
}

if (errors.length) {
    console.error(`Accessibility static check failed: ${errors.length} error(s)`)
    for (const error of errors) console.error(`  ${error}`)
    process.exitCode = 1
} else {
    console.log(`Accessibility static check passed (${files.length} source files scanned)`)
}
