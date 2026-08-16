import { buildSitemapXml, collectSitemapUrls } from '../src/lib/seo/sitemap.js'

export async function onRequest(context) {
    const urls = await collectSitemapUrls(context)
    const xml = buildSitemapXml(urls)

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml; charset=UTF-8',
            'Cache-Control': 'public, max-age=3600',
        },
    })
}