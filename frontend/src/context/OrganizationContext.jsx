import { createContext, useContext, useState, useEffect } from 'react'
import api from '../lib/api'

const OrganizationContext = createContext(null)

export function OrganizationProvider({ children }) {
    const [organization, setOrganization] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check for org slug in URL or localStorage
        const slug = new URLSearchParams(window.location.search).get('org')
            || localStorage.getItem('org_slug')

        if (slug) {
            fetchOrgBranding(slug)
        } else {
            setLoading(false)
        }
    }, [])

    const fetchOrgBranding = async (slug) => {
        try {
            const data = await api.get(`/organizations/branding/${slug}`)
            setOrganization({ slug, ...data })
            localStorage.setItem('org_slug', slug)

            // Apply org branding to CSS
            if (data.primaryColor) {
                document.documentElement.style.setProperty('--org-primary', data.primaryColor)
            }
        } catch (err) {
            console.warn('Organization not found:', slug)
            localStorage.removeItem('org_slug')
        } finally {
            setLoading(false)
        }
    }

    const clearOrganization = () => {
        setOrganization(null)
        localStorage.removeItem('org_slug')
        document.documentElement.style.removeProperty('--org-primary')
    }

    return (
        <OrganizationContext.Provider value={{
            organization,
            loading,
            setOrganization: fetchOrgBranding,
            clearOrganization
        }}>
            {children}
        </OrganizationContext.Provider>
    )
}

export function useOrganization() {
    const context = useContext(OrganizationContext)
    if (!context) {
        throw new Error('useOrganization must be used inside OrganizationProvider')
    }
    return context
}
