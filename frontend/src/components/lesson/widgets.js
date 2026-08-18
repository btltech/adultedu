import FractionLab from './FractionLab'

/**
 * Interactive lesson widgets, addressed from content by name:
 *   { "type": "interactive", "widget": "fraction-lab", "title": "...' }
 *
 * Keeping this a registry means new widgets are added here rather than by
 * growing the renderer's switch, and an unknown name degrades to nothing
 * rather than breaking the lesson around it.
 */
export const LESSON_WIDGETS = {
    'fraction-lab': FractionLab,
}

export function getLessonWidget(name) {
    return LESSON_WIDGETS[name] || null
}
