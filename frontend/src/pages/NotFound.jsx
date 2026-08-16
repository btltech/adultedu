import { Link } from 'react-router-dom'
import { ArrowRight, Compass, Home, SearchX } from 'lucide-react'
import { usePageSeo } from '../components/SEO'
import { NOT_FOUND_TAGS } from '../lib/seo/meta'

/**
 * Shown both for unmatched routes and for content routes whose lesson, topic,
 * or pathway no longer exists. Owning the noindex signal here means any page
 * that falls back to this state stops advertising itself to search engines.
 */
export default function NotFound() {
    usePageSeo(NOT_FOUND_TAGS)

    return (
        <div className="py-12">
            <div className="container-app flex min-h-[72vh] items-center justify-center">
                <div className="marketing-shell max-w-3xl px-6 py-10 text-center sm:px-10">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-dark-700 bg-dark-900/80 text-primary-300">
                        <SearchX className="h-8 w-8" />
                    </div>
                    <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-accent-300">Page not found</p>
                    <h1 className="mx-auto mt-3 max-w-2xl text-3xl font-bold text-dark-50 sm:text-4xl">We couldn't find that page.</h1>
                    <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-dark-300">
                        It may have moved, the link may be incomplete, or the lesson may no longer be part of a pathway. The quickest recovery is to return to the main pathways catalogue.
                    </p>
                    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                        <Link to="/tracks" className="btn-primary justify-center">
                            <Compass className="h-4 w-4" />
                            Browse pathways
                        </Link>
                        <Link to="/" className="btn-secondary justify-center">
                            <Home className="h-4 w-4" />
                            Home
                        </Link>
                    </div>
                    <Link to="/contact" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary-300 hover:text-primary-200">
                        Report a broken link
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </div>
    )
}
