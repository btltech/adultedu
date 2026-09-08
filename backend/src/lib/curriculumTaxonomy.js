const CATEGORY_ALIASES = Object.freeze({
    qualifications: 'qual_prep',
})

export function normalizeTrackCategory(value) {
    const category = String(value || '').trim().toLowerCase()
    return CATEGORY_ALIASES[category] || category
}

export function normalizeFrameworkSlug(value) {
    return String(value || '').trim().toUpperCase()
}

export function normalizeFrameworks(trackFrameworks = []) {
    const frameworks = new Map()

    trackFrameworks.forEach((entry) => {
        const framework = entry?.framework || entry
        const slug = normalizeFrameworkSlug(framework?.slug)
        if (!slug || frameworks.has(slug)) return
        frameworks.set(slug, {
            slug,
            title: framework?.title || slug,
        })
    })

    return [...frameworks.values()]
}
