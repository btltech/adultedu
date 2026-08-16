import { useEffect } from 'react'
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

export default function SEO() {
    const location = useLocation()

    useEffect(() => {
        const tags = getSeoTags(location.pathname)

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
    }, [location.pathname])

    return null
}
