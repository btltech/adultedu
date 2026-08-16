import { getSeoTags } from '../src/lib/seo/meta.js'

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

function applySeoTags(html, pathname) {
    const tags = getSeoTags(pathname)

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
    let response = await context.next()

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

    return new Response(applySeoTags(html, url.pathname), {
        status: response.status,
        statusText: response.statusText,
        headers,
    })
}