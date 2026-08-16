const CATEGORY_GUIDANCE = {
    workplace: {
        audience: 'Adults who need practical, confidence-building support for everyday digital tasks, work preparation, or communication.',
        outcomes: [
            'Build practical confidence with everyday tasks and guided practice.',
            'Strengthen work-readiness through structured, manageable steps.',
            'Create a clearer bridge into local adult learning, libraries, or employability support.',
        ],
        nextSteps: [
            {
                title: 'Move into work-readiness support',
                description: 'Use this as a base for communication, office, or employability routes.',
                slug: 'business-english',
            },
            {
                title: 'Keep building digital routines',
                description: 'A second digital pathway can turn confidence into regular capability.',
                slug: 'microsoft-office-essentials',
            },
            {
                title: 'Use it as a referral step',
                description: 'This route works well before local library, council, or community digital support.',
            },
        ],
    },
    qual_prep: {
        audience: 'Adults preparing for formal tests, citizenship, or structured qualification progress.',
        outcomes: [
            'Build confidence with a structured revision path instead of disconnected materials.',
            'Use practice and explanations to identify where another pass is needed.',
            'Create a clearer next step into formal study or support.',
        ],
        nextSteps: [
            {
                title: 'Progress into the next qualification stage',
                description: 'Use this route as preparation for a more advanced qualification pathway.',
            },
            {
                title: 'Add a support pathway',
                description: 'A supporting English, maths, or digital route can make the next stage easier to sustain.',
            },
            {
                title: 'Use this for provider referral',
                description: 'Completion gives a clearer starting point for adult learning teams and tutors.',
            },
        ],
    },
    tech: {
        audience: 'Adults exploring technical learning who need a structured first route into coding or digital careers.',
        outcomes: [
            'Build foundations without having to guess the correct order of topics.',
            'Use guided practice to turn reading into usable understanding.',
            'Create a platform for deeper technical or career-focused routes.',
        ],
        nextSteps: [
            {
                title: 'Move into a deeper technical pathway',
                description: 'A stronger foundation makes the next coding or cloud route more realistic.',
            },
            {
                title: 'Pair this with employability support',
                description: 'Technical learning often lands better when combined with confidence and work-readiness support.',
                slug: 'business-english',
            },
            {
                title: 'Use it as an entry route for progression',
                description: 'This route can act as the first step before provider-led digital or technical programmes.',
            },
        ],
    },
    he: {
        audience: 'Adults preparing for more formal study and academic progression.',
        outcomes: [
            'Build confidence through a more legible and structured study path.',
            'Use topic-level progress to keep revision focused and practical.',
            'Create a bridge into deeper study rather than stopping at surface exposure.',
        ],
        nextSteps: [
            {
                title: 'Move into a higher-level pathway',
                description: 'This route should make the next stage of academic study feel less abrupt.',
            },
            {
                title: 'Add a support pathway if needed',
                description: 'Supplementary English, maths, or digital support can strengthen progression.',
            },
            {
                title: 'Use this as part of provider conversations',
                description: 'Visible progress can help shape the next formal learning recommendation.',
            },
        ],
    },
}

const PATHWAY_OVERRIDES = {
    'essential-digital-skills': {
        audience: 'Adults with low or uneven digital confidence who need a practical starting point for life, services, and work.',
        outcomes: [
            'Use online services with more confidence and less guesswork.',
            'Handle everyday digital tasks like forms, communication, and basic office tools.',
            'Create a firmer base for employability or partner-led digital inclusion support.',
        ],
        nextSteps: [
            {
                title: 'Move into Microsoft Office Essentials',
                description: 'Build on the basics with more task-specific workplace digital skills.',
                slug: 'microsoft-office-essentials',
            },
            {
                title: 'Add Business English',
                description: 'Pair digital confidence with communication skills for work-readiness.',
                slug: 'business-english',
            },
            {
                title: 'Use it for local digital inclusion referral',
                description: 'This route fits well before library support sessions or community digital coaching.',
            },
        ],
    },
    'life-in-the-uk-test': {
        audience: 'Adults preparing for citizenship, settlement, or a clearer understanding of life in the UK.',
        outcomes: [
            'Revise the core themes that appear in the Life in the UK test.',
            'Use explanations to understand the answer, not just memorize it.',
            'Build a clearer next step into citizenship preparation or broader life-support routes.',
        ],
        nextSteps: [
            {
                title: 'Take the free public mock test',
                description: 'Use the public mixed test to check readiness under test-style conditions.',
                slug: 'life-in-the-uk-test',
                isTrackPage: false,
                href: '/life-in-the-uk-test',
            },
            {
                title: 'Add Essential Digital Skills',
                description: 'Digital confidence often helps with forms, services, and day-to-day tasks after citizenship prep.',
                slug: 'essential-digital-skills',
            },
            {
                title: 'Use it as a citizenship support referral',
                description: 'This route can feed into local advice, adult learning, or community support conversations.',
            },
        ],
    },
    'python-foundations': {
        audience: 'Adults who want a structured first coding route without being dropped into advanced material too early.',
        outcomes: [
            'Understand core Python ideas through a route that feels staged and practical.',
            'Use practice to turn technical reading into working recall.',
            'Create a realistic base for deeper technical learning.',
        ],
        nextSteps: [
            {
                title: 'Move into Python Mastery',
                description: 'Carry the basics forward into a more advanced Python pathway.',
                slug: 'python-mastery',
            },
            {
                title: 'Add AI for Everyone',
                description: 'Pair coding basics with broader digital and AI understanding.',
                slug: 'ai-for-everyone',
            },
            {
                title: 'Use it as a feeder into provider-led tech programmes',
                description: 'A structured starting route makes progression conversations more credible.',
            },
        ],
    },
    'gcse-maths': {
        audience: 'Adults who want a clearer GCSE maths route with structure, practice, and confidence-building support.',
        outcomes: [
            'Revise maths topics in a more legible order than scattered revision alone.',
            'Use question feedback to see where another pass is still needed.',
            'Create a base for GCSE readiness or broader qualification progression.',
        ],
        nextSteps: [
            {
                title: 'Progress toward A-Level Maths',
                description: 'A stronger GCSE base makes the higher route more realistic.',
                slug: 'a-level-maths',
            },
            {
                title: 'Add Functional Skills Maths support',
                description: 'A practical support route can help stabilize confidence where needed.',
                slug: 'functional-skills-maths',
            },
            {
                title: 'Use it as a progression discussion with providers',
                description: 'Visible maths progress helps shape realistic next-step recommendations.',
            },
        ],
    },
}

export function getPathwayGuidance(track) {
    const categoryGuidance = CATEGORY_GUIDANCE[track.category] || CATEGORY_GUIDANCE.workplace
    const override = PATHWAY_OVERRIDES[track.slug] || {}

    return {
        audience: override.audience || categoryGuidance.audience,
        outcomes: override.outcomes || categoryGuidance.outcomes,
        nextSteps: override.nextSteps || categoryGuidance.nextSteps,
    }
}