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
