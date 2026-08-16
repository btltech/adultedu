import { createContext, useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getSeoTags } from '../lib/seo/meta'

function upsertMeta(selector, attributes) {
    let element = document.head.querySelector(selector)

    if (!element) {
        element = document.createElement('meta')
        document.head.appendChild(element)
    }

    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value)
    })
}

function upsertLink(rel, href) {
    let element = document.head.querySelector(`link[rel="${rel}"]`)

    if (!element) {
        element = document.createElement('link')
        element.setAttribute('rel', rel)
        document.head.appendChild(element)
    }

    element.setAttribute('href', href)
}

function upsertJsonLd(id, data) {
    let element = document.head.querySelector(`script#${id}`)

    if (!element) {
        element = document.createElement('script')
        element.id = id
        element.type = 'application/ld+json'
        document.head.appendChild(element)
    }

    element.textContent = JSON.stringify(data)
}

function removeElement(selector) {
    document.head.querySelector(selector)?.remove()
}

const SeoOverrideContext = createContext(null)

/**
 * Lets a page supply its own title/description once its data has loaded.
 *
 * Route-pattern metadata alone cannot tell one lesson from another, so every
 * /lesson/* and /topic/* URL would otherwise ship an identical title and
 * description to search engines. Overrides live in context rather than being
 * written to <head> directly by each page, so the baseline tags and the page
 * tags can never race — SeoProvider is the only writer.
 */
export function usePageSeo({ title, description, robots } = {}) {
    const setOverride = useContext(SeoOverrideContext)

    useEffect(() => {
        if (!setOverride || (!title && !description && !robots)) return

        setOverride({ title, description, robots })
        return () => setOverride(null)
    }, [setOverride, title, description, robots])
}

export function SeoProvider({ children }) {
    const location = useLocation()
    const [override, setOverride] = useState(null)

    // Drop a page's override the moment the route changes, so a lesson title
    // can never linger on the next page while its data loads.
    useEffect(() => {
        setOverride(null)
    }, [location.pathname])

    useEffect(() => {
        const base = getSeoTags(location.pathname)
        // Hand-written metadata for a specific route is deliberate copy, so a
        // page override only fills in where the baseline is a shared placeholder.
        const useOverride = base.generic && override
        // `robots` is exempt: it reports whether the content actually exists,
        // which curated copy has no say over. A deleted curated pathway still
        // needs noindex.
        const tags = {
            ...base,
            title: (useOverride && override.title) || base.title,
            description: (useOverride && override.description) || base.description,
            robots: override?.robots || base.robots,
        }
        // Structured data advertises a real page, so it goes when robots does.
        if (!tags.robots.startsWith('index')) tags.jsonLd = null

        document.title = tags.title
        upsertMeta('meta[name="description"]', { name: 'description', content: tags.description })
        upsertMeta('meta[name="robots"]', { name: 'robots', content: tags.robots })
        upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' })
        upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: tags.siteName })
        upsertMeta('meta[property="og:url"]', { property: 'og:url', content: tags.canonicalUrl })
        upsertMeta('meta[property="og:title"]', { property: 'og:title', content: tags.title })
        upsertMeta('meta[property="og:description"]', { property: 'og:description', content: tags.description })
        upsertMeta('meta[property="og:image"]', { property: 'og:image', content: tags.image })
        upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' })
        upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: tags.title })
        upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: tags.description })
        upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: tags.image })
        upsertLink('canonical', tags.canonicalUrl)

        if (tags.jsonLd) {
            upsertJsonLd('adultedu-jsonld', tags.jsonLd)
        } else {
            removeElement('script#adultedu-jsonld')
        }
    }, [location.pathname, override])

    return (
        <SeoOverrideContext.Provider value={setOverride}>
            {children}
        </SeoOverrideContext.Provider>
    )
}
