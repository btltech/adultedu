const STATIC_PUBLIC_PATHS = [
    '/',
    '/tracks',
    '/life-in-the-uk-test',
    '/about',
    '/contact',
    '/accessibility',
    '/privacy-policy',
    '/terms',
    '/cookies',
]

const DISALLOWED_PATHS = [
    '/admin',
    '/dashboard',
    '/daily',
    '/login',
    '/practice',
    '/progress',
    '/review',
    '/forgot-password',
    '/reset-password',
    '/start',
    '/signup',
]

function stripTrailingSlash(value) {
    return String(value || '').replace(/\/+$/, '')
}

function escapeXml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

function buildAbsoluteUrl(origin, path) {
    return new URL(path, origin).toString()
}

function toIsoTimestamp(value) {
    if (!value) return null

    const date = value instanceof Date ? value : new Date(value)
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function buildSitemapEntry(origin, path, lastmod) {
    return {
        loc: buildAbsoluteUrl(origin, path),
        lastmod: toIsoTimestamp(lastmod),
    }
}

async function fetchJson(url, fetchImpl) {
    const response = await fetchImpl(url, {
        headers: {
            Accept: 'application/json',
        },
    })

    if (!response.ok) {
        throw new Error(`Request failed for ${url}: ${response.status}`)
    }

    return response.json()
}

export function getSiteOrigin(request) {
    return stripTrailingSlash(new URL(request.url).origin)
}

export function getApiBaseUrl({ request, env }) {
    const requestOrigin = getSiteOrigin(request)
    const apiOrigin = stripTrailingSlash(env?.API_ORIGIN || requestOrigin)
    return apiOrigin.endsWith('/api/v1') ? apiOrigin : `${apiOrigin}/api/v1`
}

export function buildSitemapXml(urls) {
    const uniqueUrls = new Map()

    for (const item of urls) {
        const entry = typeof item === 'string'
            ? { loc: item, lastmod: null }
            : { loc: item?.loc, lastmod: toIsoTimestamp(item?.lastmod) }

        if (!entry.loc) continue

        const existing = uniqueUrls.get(entry.loc)
        if (!existing || (!existing.lastmod && entry.lastmod)) {
            uniqueUrls.set(entry.loc, entry)
        }
    }

    const body = [...uniqueUrls.values()]
        .map((entry) => {
            const lastmodTag = entry.lastmod ? `<lastmod>${escapeXml(entry.lastmod)}</lastmod>` : ''
            return `  <url><loc>${escapeXml(entry.loc)}</loc>${lastmodTag}</url>`
        })
        .join('\n')

    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        body,
        '</urlset>',
    ].join('\n')
}

export function buildRobotsTxt(origin) {
    return [
        'User-agent: *',
        'Allow: /',
        ...DISALLOWED_PATHS.map((path) => `Disallow: ${path}`),
        `Sitemap: ${buildAbsoluteUrl(origin, '/sitemap.xml')}`,
        '',
    ].join('\n')
}

export async function collectSitemapUrls({ request, env, fetchImpl = fetch }) {
    const origin = getSiteOrigin(request)
    const apiBaseUrl = getApiBaseUrl({ request, env })
    const generatedAt = new Date().toISOString()
    const urls = new Map(
        STATIC_PUBLIC_PATHS.map((path) => [path, buildSitemapEntry(origin, path, generatedAt)])
    )

    let tracks = []
    try {
        const trackRows = await fetchJson(`${apiBaseUrl}/tracks`, fetchImpl)
        tracks = Array.isArray(trackRows) ? trackRows.filter((track) => track?.isLive) : []
    } catch {
        return [...urls.values()]
    }

    for (const track of tracks) {
        if (!track?.slug) continue
        const trackPath = `/track/${encodeURIComponent(track.slug)}`
        urls.set(trackPath, buildSitemapEntry(origin, trackPath, track.updatedAt || track.createdAt || generatedAt))
    }

    const trackDetails = await Promise.all(
        tracks.map(async (track) => {
            try {
                return await fetchJson(`${apiBaseUrl}/tracks/${encodeURIComponent(track.slug)}`, fetchImpl)
            } catch {
                return null
            }
        })
    )

    for (const track of trackDetails) {
        if (!track || !Array.isArray(track.topics)) continue

        const trackLastmod = track.updatedAt || track.createdAt || generatedAt

        for (const topic of track.topics) {
            if (!topic?.id) continue

            const topicPath = `/topic/${encodeURIComponent(topic.id)}`
            const topicLastmod = topic.updatedAt || topic.createdAt || trackLastmod
            urls.set(topicPath, buildSitemapEntry(origin, topicPath, topicLastmod))

            if (!Array.isArray(topic.lessons)) continue
            for (const lesson of topic.lessons) {
                if (!lesson?.id) continue

                const lessonPath = `/lesson/${encodeURIComponent(lesson.id)}`
                const lessonLastmod = lesson.updatedAt || lesson.createdAt || topicLastmod
                urls.set(lessonPath, buildSitemapEntry(origin, lessonPath, lessonLastmod))
            }
        }
    }

    return [...urls.values()]
}