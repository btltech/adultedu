const AUTH_PATHS = new Set(['/login', '/signup', '/forgot-password', '/reset-password'])

function safePathPart(value, prefix) {
    return typeof value === 'string' && (!value || value.startsWith(prefix)) ? value : ''
}

export function normaliseReturnLocation(value, fallback = '/') {
    const fallbackPath = typeof fallback === 'string' && fallback.startsWith('/') && !fallback.startsWith('//')
        ? fallback
        : '/'
    const pathname = typeof value?.pathname === 'string' && value.pathname.startsWith('/') && !value.pathname.startsWith('//')
        ? value.pathname
        : fallbackPath

    if (AUTH_PATHS.has(pathname)) return { pathname: fallbackPath, search: '', hash: '', state: null }

    return {
        pathname,
        search: safePathPart(value?.search, '?'),
        hash: safePathPart(value?.hash, '#'),
        state: value?.state ?? null,
    }
}

export function returnLocationPath(location) {
    return `${location.pathname}${location.search || ''}${location.hash || ''}`
}

export function authReturnState(location, fallback = '/') {
    return { from: normaliseReturnLocation(location, fallback) }
}
