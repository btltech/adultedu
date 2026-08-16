import { buildRobotsTxt, getSiteOrigin } from '../src/lib/seo/sitemap.js'

export async function onRequest({ request }) {
    const body = buildRobotsTxt(getSiteOrigin(request))

    return new Response(body, {
        headers: {
            'Content-Type': 'text/plain; charset=UTF-8',
            'Cache-Control': 'public, max-age=3600',
        },
    })
}