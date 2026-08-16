export const SITE_NAME = 'AdultEdu'
export const SITE_ORIGIN = 'https://adult-edu.org'
export const DEFAULT_TITLE = 'AdultEdu - UK Adult Learning Platform'
export const DEFAULT_DESCRIPTION = 'AdultEdu helps adults in the UK find structured pathways for digital confidence, GCSE preparation, Life in the UK revision, workplace skills, and tech foundations.'
export const DEFAULT_IMAGE = `${SITE_ORIGIN}/logo.png`

export const ROUTE_META = [
    {
        pattern: /^\/$/,
        title: 'AdultEdu - UK Adult Learning Pathways',
        description: 'Find a clear adult learning pathway for digital confidence, GCSE preparation, Life in the UK revision, workplace skills, and tech foundations.',
    },
    {
        pattern: /^\/tracks\/?$/,
        title: 'Adult Learning Pathways - AdultEdu',
        description: 'Browse UK adult learning pathways across digital skills, GCSE and Functional Skills preparation, Life in the UK, workplace skills, and technology.',
    },
    {
        pattern: /^\/life-in-the-uk-test\/?$/,
        title: 'Free Life in the UK Mock Test - AdultEdu',
        description: 'Take a free Life in the UK mock test with exam-style questions, explanations, and revision links across values, history, society, geography, and government.',
    },
    {
        pattern: /^\/track\/life-in-the-uk-test\/?$/,
        title: 'Life in the UK Test Preparation Pathway - AdultEdu',
        description: 'Prepare for the Life in the UK test with structured revision topics, practice questions, explanations, and a free public mock test.',
    },
    {
        pattern: /^\/track\/essential-digital-skills\/?$/,
        title: 'Essential Digital Skills Pathway - AdultEdu',
        description: 'Build everyday digital confidence with a structured pathway for online services, communication, forms, and practical workplace tasks.',
    },
    {
        pattern: /^\/track\/python-foundations\/?$/,
        title: 'Python Foundations Pathway - AdultEdu',
        description: 'Start learning Python with a calm, structured route for adult learners building coding confidence from the foundations.',
    },
    {
        pattern: /^\/track\/gcse-maths\/?$/,
        title: 'GCSE Maths Preparation Pathway - AdultEdu',
        description: 'Revise GCSE maths through structured topics, guided practice, and explanations designed for adult learners.',
    },
    {
        pattern: /^\/track\/[^/]+\/?$/,
        title: 'Adult Learning Pathway - AdultEdu',
        description: 'Explore this AdultEdu pathway with structured topics, guided lessons, and practice for adult learners in the UK.',
    },
    {
        pattern: /^\/topic\/[^/]+\/?$/,
        title: 'Learning Topic - AdultEdu',
        description: 'Review this AdultEdu topic with lessons, practice, and progress guidance within a structured adult learning pathway.',
    },
    {
        pattern: /^\/lesson\/[^/]+\/?$/,
        title: 'Learning Lesson - AdultEdu',
        description: 'Study this AdultEdu lesson as part of a structured UK adult learning pathway.',
    },
    {
        pattern: /^\/about\/?$/,
        title: 'About AdultEdu - UK Adult Learning Platform',
        description: 'Learn how AdultEdu supports UK adult learners with structured pathways, confidence-building practice, and partner-ready learning evidence.',
    },
    {
        pattern: /^\/contact\/?$/,
        title: 'Contact AdultEdu',
        description: 'Contact AdultEdu for learner support, partner enquiries, data requests, or platform questions.',
    },
    {
        pattern: /^\/accessibility\/?$/,
        title: 'Accessibility Statement - AdultEdu',
        description: 'Read the AdultEdu accessibility statement and learn how the platform supports keyboard navigation, readable layouts, and inclusive access.',
    },
    {
        pattern: /^\/privacy-policy\/?$/,
        title: 'Privacy Policy - AdultEdu',
        description: 'Read how AdultEdu collects, uses, and protects learner data in line with UK data protection expectations.',
    },
    {
        pattern: /^\/terms\/?$/,
        title: 'Terms of Use - AdultEdu',
        description: 'Read the terms for using AdultEdu, including account responsibilities, acceptable use, and learning platform limitations.',
    },
    {
        pattern: /^\/cookies\/?$/,
        title: 'Cookie Policy - AdultEdu',
        description: 'Read which strictly necessary cookies AdultEdu uses for secure sessions and CSRF protection.',
    },
    {
        pattern: /^\/(login|signup|forgot-password|reset-password|dashboard|progress|review|daily|start|practice\/.*|admin.*)\/?$/,
        title: 'AdultEdu Account',
        description: DEFAULT_DESCRIPTION,
        robots: 'noindex, nofollow',
    },
]

export function resolveRouteMeta(pathname) {
    return ROUTE_META.find((entry) => entry.pattern.test(pathname)) || {
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
    }
}

export function buildCanonicalUrl(pathname) {
    return `${SITE_ORIGIN}${pathname === '/' ? '/' : pathname.replace(/\/$/, '')}`
}

export function buildOrganizationJsonLd() {
    return {
        '@context': 'https://schema.org',
        '@type': 'EducationalOrganization',
        name: SITE_NAME,
        url: SITE_ORIGIN,
        logo: DEFAULT_IMAGE,
        description: DEFAULT_DESCRIPTION,
        areaServed: 'United Kingdom',
        sameAs: [],
        potentialAction: {
            '@type': 'SearchAction',
            target: `${SITE_ORIGIN}/tracks?search={search_term_string}`,
            'query-input': 'required name=search_term_string',
        },
    }
}

export function getSeoTags(pathname) {
    const meta = resolveRouteMeta(pathname)
    const robots = meta.robots || 'index, follow'

    return {
        title: meta.title || DEFAULT_TITLE,
        description: meta.description || DEFAULT_DESCRIPTION,
        robots,
        canonicalUrl: buildCanonicalUrl(pathname),
        image: DEFAULT_IMAGE,
        siteName: SITE_NAME,
        jsonLd: robots.startsWith('index') ? buildOrganizationJsonLd() : null,
    }
}