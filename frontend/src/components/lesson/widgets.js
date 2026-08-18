import FractionLab from './FractionLab'
import GradientExplorer from './GradientExplorer'
import ProbabilitySpinner from './ProbabilitySpinner'
import RatioMixer from './RatioMixer'
import TimelineBuilder from './TimelineBuilder'

/**
 * Interactive lesson widgets, addressed from content by name:
 *   { "type": "interactive", "widget": "fraction-lab", "title": "..." }
 *
 * Keeping this a registry means new widgets are added here rather than by
 * growing the renderer's switch, and an unknown name degrades to nothing
 * rather than breaking the lesson around it.
 */
export const LESSON_WIDGETS = {
    'fraction-lab': FractionLab,
    'probability-spinner': ProbabilitySpinner,
    'ratio-mixer': RatioMixer,
    'gradient-explorer': GradientExplorer,
    'history-timeline': TimelineBuilder,
}

export function getLessonWidget(name) {
    return LESSON_WIDGETS[name] || null
}
