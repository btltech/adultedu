import { Link } from 'react-router-dom'

const LAST_UPDATED = '12 April 2026'
const CONTACT_EMAIL = 'hello@adult-edu.org'

function Section({ title, children }) {
    return (
        <section className="mb-10">
            <h2 className="text-xl font-semibold text-dark-50 mb-4">{title}</h2>
            <div className="space-y-4 text-sm leading-7 text-dark-300">{children}</div>
        </section>
    )
}

export default function Accessibility() {
    return (
        <div className="py-12">
            <div className="container-app max-w-3xl">
                <div className="mb-10">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary-400 mb-3">Accessibility</p>
                    <h1 className="text-3xl font-bold text-dark-50 mb-3">Accessibility Statement</h1>
                    <p className="text-sm text-dark-500">Last updated: {LAST_UPDATED}</p>
                </div>

                <div className="progress-panel mb-8 text-sm leading-7 text-dark-300">
                    AdultEdu is committed to making this platform usable by as many people as possible. We want the
                    experience to feel calm and navigable whether you are using a keyboard, an assistive technology,
                    a small screen, or a low-bandwidth connection.
                </div>

                <Section title="Conformance status">
                    <p>
                        We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA. The platform is
                        partially conformant — most pages meet these guidelines, but some areas are still being improved.
                    </p>
                </Section>

                <Section title="What we have done">
                    <ul className="ml-4 space-y-2">
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                            <span>Skip-to-content links on every page so keyboard users can bypass navigation.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                            <span>Semantic HTML landmarks (header, main, nav, footer) on all main pages.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                            <span>Keyboard shortcuts on the practice and mock test pages (1–4 to select, Enter to submit).</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                            <span>Sufficient colour contrast ratios across the dark theme for main text and interactive elements.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                            <span>Responsive layout that adapts to mobile, tablet, and desktop screen sizes.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                            <span>Focus-visible styles on all interactive elements for keyboard navigation.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                            <span>Loading states and error messages communicated clearly in text, not colour alone.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                            <span>Form inputs have visible labels and descriptive placeholders.</span>
                        </li>
                    </ul>
                </Section>

                <Section title="Known limitations">
                    <p>We are aware of the following areas that are still being improved:</p>
                    <ul className="ml-4 space-y-2">
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                            <span>Some drag-and-drop question types (ordering questions) do not yet have a full keyboard-accessible alternative.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                            <span>Some progress charts in the dashboard use visual representations that are not fully described for screen reader users.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                            <span>Mathematical notation in some questions may not be fully read aloud by all screen readers.</span>
                        </li>
                    </ul>
                    <p>We are actively working to address these limitations in future updates.</p>
                </Section>

                <Section title="Assistive technology">
                    <p>
                        The platform has been tested with keyboard-only navigation. We aim for compatibility with common
                        screen readers including NVDA, JAWS, and VoiceOver, though formal audits are ongoing.
                    </p>
                </Section>

                <Section title="Text size and display">
                    <p>
                        You can adjust text size using your browser or operating system settings. The platform uses relative
                        font sizes so content scales with your preferences. High-contrast mode and forced colours are
                        supported in modern browsers.
                    </p>
                </Section>

                <Section title="Feedback and contact">
                    <p>
                        If you experience any difficulty using this platform or have a suggestion for improvement, please
                        contact us at{' '}
                        <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary-400 hover:text-primary-300">
                            {CONTACT_EMAIL}
                        </a>. We take accessibility feedback seriously and will aim to respond within 5 working days.
                    </p>
                    <p>
                        If you are not satisfied with our response, you can contact the{' '}
                        <a
                            href="https://www.equalityhumanrights.com/en"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-400 hover:text-primary-300"
                        >
                            Equality and Human Rights Commission (EHRC)
                        </a>.
                    </p>
                </Section>

                <div className="pt-8 border-t border-dark-800/50 flex flex-col sm:flex-row gap-4 text-sm text-dark-400">
                    <Link to="/privacy-policy" className="hover:text-dark-200 transition-colors">Privacy Policy</Link>
                    <Link to="/contact" className="hover:text-dark-200 transition-colors">Contact us</Link>
                </div>
            </div>
        </div>
    )
}
