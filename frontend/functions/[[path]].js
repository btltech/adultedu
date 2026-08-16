import {
    getSeoTags,
    lessonSeoTags,
    mergeSeoTags,
    NOT_FOUND_TAGS,
    topicSeoTags,
    trackSeoTags,
} from '../src/lib/seo/meta.js'
import { getApiBaseUrl } from '../src/lib/seo/sitemap.js'

// Dynamic routes carry an identifier the URL alone cannot validate, so the
// edge asks the API whether the entity exists. That single lookup decides both
// the HTTP status and the real title/description — which matters for social
// scrapers (Slack, WhatsApp, LinkedIn, X) that never execute the app's JS and
// would otherwise preview every lesson with the same placeholder title.
const DYNAMIC_ROUTES = [
    { pattern: /^\/lesson\/([^/]+)\/?$/, collection: 'lessons', toTags: lessonSeoTags },
    { pattern: /^\/topic\/([^/]+)\/?$/, collection: 'topics', toTags: topicSeoTags },
    { pattern: /^\/track\/([^/]+)\/?$/, collection: 'tracks', toTags: trackSeoTags },
]

const API_CACHE_SECONDS = 300
const API_TIMEOUT_MS = 2000

const HTML_EXCLUDED_PREFIXES = [
    '/api/',
    '/assets/',
    '/icons/',
]

const HTML_EXCLUDED_PATHS = new Set([
    '/favicon.ico',
    '/logo.png',
    '/logo.svg',
    '/manifest.json',
    '/robots.txt',
    '/sitemap.xml',
    '/sw.js',
    '/workbox-f19dbf24.js',
])

const SPA_ROUTES = new Set([
    '/',
    '/about',
    '/accessibility',
    '/contact',
    '/cookies',
    '/daily',
    '/dashboard',
    '/forgot-password',
    '/life-in-the-uk-test',
    '/login',
    '/privacy-policy',
    '/progress',
    '/reset-password',
    '/review',
    '/signup',
    '/start',
    '/terms',
    '/tracks',
    '/verify-email',
])

const SPA_ROUTE_PATTERNS = [
    /^\/lesson\/[^/]+\/?$/,
    /^\/practice\/[^/]+\/?$/,
    /^\/topic\/[^/]+\/?$/,
    /^\/track\/[^/]+\/?$/,
    /^\/admin\/?$/,
    /^\/admin\/(?:analytics|content|partners|settings|users)\/?$/,
    /^\/admin\/questions\/(?:new|[^/]+)\/?$/,
]

function isKnownSpaRoute(pathname) {
    const normalized = pathname === '/' ? pathname : pathname.replace(/\/$/, '')
    return SPA_ROUTES.has(normalized) || SPA_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname))
}

function shouldRewriteHtml(request) {
    if (request.method !== 'GET') return false

    const url = new URL(request.url)
    if (HTML_EXCLUDED_PATHS.has(url.pathname)) return false
    if (HTML_EXCLUDED_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) return false

    return !/\.[a-z0-9]+$/i.test(url.pathname)
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

function safeJsonScript(value) {
    return JSON.stringify(value).replace(/</g, '\\u003c')
}

function injectBeforeHeadClose(html, markup) {
    return html.includes('</head>') ? html.replace('</head>', `${markup}\n</head>`) : `${html}\n${markup}`
}

function upsertTitle(html, title) {
    const markup = `<title>${escapeHtml(title)}</title>`
    return /<title>[\s\S]*?<\/title>/i.test(html)
        ? html.replace(/<title>[\s\S]*?<\/title>/i, markup)
        : injectBeforeHeadClose(html, markup)
}

function upsertMetaName(html, name, content) {
    const markup = `<meta name="${escapeHtml(name)}" content="${escapeHtml(content)}" />`
    const pattern = new RegExp(`<meta\\s+[^>]*name=["']${name}["'][^>]*>`, 'i')
    return pattern.test(html) ? html.replace(pattern, markup) : injectBeforeHeadClose(html, markup)
}

function upsertMetaProperty(html, property, content) {
    const markup = `<meta property="${escapeHtml(property)}" content="${escapeHtml(content)}" />`
    const pattern = new RegExp(`<meta\\s+[^>]*property=["']${property}["'][^>]*>`, 'i')
    return pattern.test(html) ? html.replace(pattern, markup) : injectBeforeHeadClose(html, markup)
}

function upsertCanonical(html, href) {
    const markup = `<link rel="canonical" href="${escapeHtml(href)}" />`
    return /<link\s+[^>]*rel=["']canonical["'][^>]*>/i.test(html)
        ? html.replace(/<link\s+[^>]*rel=["']canonical["'][^>]*>/i, markup)
        : injectBeforeHeadClose(html, markup)
}

function upsertJsonLd(html, jsonLd) {
    const pattern = /<script\s+[^>]*id=["']adultedu-jsonld["'][^>]*>[\s\S]*?<\/script>/i

    if (!jsonLd) {
        return html.replace(pattern, '')
    }

    const markup = `<script id="adultedu-jsonld" type="application/ld+json">${safeJsonScript(jsonLd)}</script>`
    return pattern.test(html) ? html.replace(pattern, markup) : injectBeforeHeadClose(html, markup)
}

/**
 * Fetch an API resource, caching only definitive answers. A timeout or 5xx is
 * deliberately left uncached so a brief outage cannot pin a wrong verdict for
 * the whole TTL.
 */
async function fetchEntity(context, url) {
    const cache = caches.default
    const cacheKey = new Request(url, { headers: { Accept: 'application/json' } })

    const hit = await cache.match(cacheKey)
    if (hit) return hit

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS)

    try {
        const response = await fetch(cacheKey, { signal: controller.signal })
        if (response.status !== 200 && response.status !== 404) return response

        const body = await response.text()
        const cacheable = new Response(body, {
            status: response.status,
            headers: {
                'content-type': 'application/json',
                'Cache-Control': `public, max-age=${API_CACHE_SECONDS}`,
            },
        })

        context.waitUntil(cache.put(cacheKey, cacheable.clone()))
        return cacheable
    } finally {
        clearTimeout(timer)
    }
}

/**
 * Resolve a dynamic route to one of: 'static' (not a dynamic route), 'found'
 * (with tags), 'missing' (a real 404), or 'unknown' (the API could not answer).
 * 'unknown' must behave exactly like today's pattern-only rendering — an outage
 * must never make live content report itself as deleted.
 */
async function resolveEntity(context, pathname) {
    const route = DYNAMIC_ROUTES.find((entry) => entry.pattern.test(pathname))
    if (!route) return { state: 'static' }

    let id
    try {
        id = decodeURIComponent(route.pattern.exec(pathname)[1])
    } catch {
        // A malformed URL component cannot name a real entity. Handle it as a
        // normal missing page instead of allowing decoding to fail the whole
        // Pages Function request.
        return { state: 'missing' }
    }
    const apiBaseUrl = getApiBaseUrl({ request: context.request, env: context.env })
    const url = `${apiBaseUrl}/${route.collection}/${encodeURIComponent(id)}`

    try {
        const response = await fetchEntity(context, url)
        if (response.status === 404) return { state: 'missing' }
        if (!response.ok) return { state: 'unknown' }

        return { state: 'found', tags: route.toTags(await response.json()) }
    } catch {
        return { state: 'unknown' }
    }
}

function applySeoTags(html, pathname, override) {
    const tags = mergeSeoTags(getSeoTags(pathname), override)

    let nextHtml = html
    nextHtml = upsertTitle(nextHtml, tags.title)
    nextHtml = upsertMetaName(nextHtml, 'description', tags.description)
    nextHtml = upsertMetaName(nextHtml, 'robots', tags.robots)
    nextHtml = upsertMetaProperty(nextHtml, 'og:type', 'website')
    nextHtml = upsertMetaProperty(nextHtml, 'og:site_name', tags.siteName)
    nextHtml = upsertMetaProperty(nextHtml, 'og:url', tags.canonicalUrl)
    nextHtml = upsertMetaProperty(nextHtml, 'og:title', tags.title)
    nextHtml = upsertMetaProperty(nextHtml, 'og:description', tags.description)
    nextHtml = upsertMetaProperty(nextHtml, 'og:image', tags.image)
    nextHtml = upsertMetaName(nextHtml, 'twitter:card', 'summary_large_image')
    nextHtml = upsertMetaName(nextHtml, 'twitter:title', tags.title)
    nextHtml = upsertMetaName(nextHtml, 'twitter:description', tags.description)
    nextHtml = upsertMetaName(nextHtml, 'twitter:image', tags.image)
    nextHtml = upsertCanonical(nextHtml, tags.canonicalUrl)
    nextHtml = upsertJsonLd(nextHtml, tags.jsonLd)

    return nextHtml
}

export async function onRequest(context) {
    if (!shouldRewriteHtml(context.request)) {
        return context.next()
    }

    const url = new URL(context.request.url)

    // The asset fetch and the entity lookup are independent, so run them
    // together: the lookup costs roughly nothing on top of serving the shell.
    const [assetResponse, entity] = await Promise.all([
        context.next(),
        resolveEntity(context, url.pathname),
    ])

    let response = assetResponse
    const isKnownRoute = isKnownSpaRoute(url.pathname)
    const shouldReturnNotFound = !isKnownRoute || entity.state === 'missing'
    // Anything answered with a 404 gets the not-found signal, whether it failed
    // route matching or the API said the entity is gone. Otherwise a 404'd URL
    // would still ship index/follow and organisation JSON-LD.
    const seoOverride = shouldReturnNotFound
        ? NOT_FOUND_TAGS
        : entity.state === 'found' ? entity.tags : null

    if (response.status === 404) {
        const indexRequest = new Request(new URL('/index.html', context.request.url), context.request)
        response = await context.env.ASSETS.fetch(indexRequest)
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html')) {
        return response
    }

    const html = await response.text()
    const headers = new Headers(response.headers)
    headers.delete('content-length')
    headers.set('content-type', 'text/html; charset=UTF-8')
    headers.set('x-adultedu-seo-render', 'edge-html')

    return new Response(applySeoTags(html, url.pathname, seoOverride), {
        // Pages' SPA fallback serves index.html with 200 for every unknown
        // extensionless URL. Keep that shell for React's NotFound screen, but
        // retain the HTTP 404 so browsers, crawlers, and link checkers do not
        // treat a missing page as real content. A dynamic route the API
        // reported as gone gets the same treatment; one it could not answer
        // for does not, so an outage cannot 404 the whole catalogue.
        status: shouldReturnNotFound ? 404 : response.status,
        statusText: shouldReturnNotFound ? 'Not Found' : response.statusText,
        headers,
    })
}
