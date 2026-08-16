export const QUESTION_TARGET_PROFILE_NAME = 'adultedu'

const TRACK_TARGETS = {
    'life-in-the-uk-test': 100,
    'a-level-maths': 70,
    'gcse-maths': 60,
    'gcse-computer-science': 60,
    'gcse-biology': 60,
    'gcse-chemistry': 60,
    'gcse-english-language': 55,
    'gcse-english-literature': 55,
    'gcse-geography': 55,
    'gcse-history': 55,
    'gcse-physics': 60,
    'python-foundations': 50,
    'python-mastery': 70,
    'cpp-introduction': 50,
    'aws-cloud-practitioner': 50,
    'intro-to-ai': 45,
    'ai-for-everyone': 40,
    'essential-digital-skills': 40,
    'microsoft-office-essentials': 40,
    'business-english': 40,
    'financial-literacy': 40,
    'functional-skills-english': 45,
    'functional-skills-maths': 50,
}

const CATEGORY_TARGETS = {
    workplace: 40,
    tech: 50,
    qual_prep: 55,
    qualifications: 55,
}

export function resolveQuestionTarget({ trackSlug, category, fallbackTarget = 50 }) {
    if (trackSlug && Object.prototype.hasOwnProperty.call(TRACK_TARGETS, trackSlug)) {
        return TRACK_TARGETS[trackSlug]
    }

    if (category && Object.prototype.hasOwnProperty.call(CATEGORY_TARGETS, category)) {
        return CATEGORY_TARGETS[category]
    }

    return fallbackTarget
}

export function getQuestionTargetProfileSummary() {
    return {
        name: QUESTION_TARGET_PROFILE_NAME,
        trackTargets: TRACK_TARGETS,
        categoryTargets: CATEGORY_TARGETS,
    }
}
