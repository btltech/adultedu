import { Link } from 'react-router-dom'
import { BookOpenCheck, BriefcaseBusiness, Code2, GraduationCap, ShieldCheck, Users } from 'lucide-react'

export default function About() {
    return (
        <div className="py-12">
            <div className="container-app max-w-4xl">

                {/* Hero */}
                <section className="marketing-shell mb-10 px-6 py-10 sm:px-10 sm:py-12">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary-400 mb-4">About AdultEdu</p>
                    <h1 className="text-3xl font-bold text-dark-50 sm:text-4xl mb-5 max-w-2xl">
                        A learning platform built around adult learners, not exam scores.
                    </h1>
                    <p className="text-base leading-8 text-dark-300 max-w-2xl">
                        AdultEdu exists to give adults in the UK a structured, supportive route into the skills and
                        qualifications they need — whether that is digital confidence, a GCSE, citizenship preparation,
                        or a first step into coding. The platform is designed to feel calm and purposeful, not like a
                        crowded app trying to hold your attention.
                    </p>
                </section>

                {/* Mission */}
                <section className="mb-10">
                    <h2 className="text-xl font-semibold text-dark-50 mb-6">What we set out to do</h2>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                            {
                                icon: BookOpenCheck,
                                title: 'Structured pathways',
                                body: 'Each track is built around a clear topic structure, UK learning levels, and published outcomes — so learners always know where they are going.',
                            },
                            {
                                icon: ShieldCheck,
                                title: 'Confidence before speed',
                                body: 'Questions are designed to teach, not just score. Explanations accompany every answer so a wrong attempt still moves learning forward.',
                            },
                            {
                                icon: Users,
                                title: 'Designed for adults',
                                body: 'The content, tone, and pace are built for adult learners returning to learning — not for school pupils preparing for a standard exam cycle.',
                            },
                        ].map(({ icon: Icon, title, body }) => (
                            <div key={title} className="feature-panel">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/12 text-primary-300 mb-4">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <h3 className="font-semibold text-dark-100 mb-2">{title}</h3>
                                <p className="text-sm leading-6 text-dark-400">{body}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Tracks */}
                <section className="mb-10">
                    <h2 className="text-xl font-semibold text-dark-50 mb-4">What we cover</h2>
                    <p className="text-sm leading-7 text-dark-300 mb-6 max-w-2xl">
                        The platform covers a growing range of UK-aligned learning pathways, each mapped to recognised
                        frameworks so progression feels grounded.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {[
                            { icon: ShieldCheck, label: 'Essential Digital Skills', sub: 'EDS framework · Workplace readiness' },
                            { icon: GraduationCap, label: 'GCSE and A-Level Preparation', sub: 'Maths, English, Sciences, History, Geography' },
                            { icon: BookOpenCheck, label: 'Functional Skills', sub: 'English and Maths at Entry and Level 1–2' },
                            { icon: ShieldCheck, label: 'Life in the UK Preparation', sub: 'Citizenship test revision with free public mock test' },
                            { icon: Code2, label: 'Tech Foundations', sub: 'Python, C++, AWS, AI for beginners' },
                            { icon: BriefcaseBusiness, label: 'Workplace Skills', sub: 'Business English, Office tools, Employability' },
                        ].map(({ icon: Icon, label, sub }) => (
                            <div key={label} className="flex items-start gap-4 rounded-2xl border border-dark-800/70 bg-dark-900/60 p-4">
                                <div className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/12 text-primary-300">
                                    <Icon className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-dark-100">{label}</p>
                                    <p className="text-xs text-dark-500 mt-0.5">{sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Partner */}
                <section className="mb-10">
                    <h2 className="text-xl font-semibold text-dark-50 mb-4">Working with organisations</h2>
                    <div className="progress-panel text-sm leading-7 text-dark-300 space-y-3">
                        <p>
                            AdultEdu supports partner delivery for libraries, councils, colleges, charities, and employability
                            providers who want to direct learners to a structured self-study resource. Partners can track
                            cohort progress, export anonymised evidence reports, and use the platform as part of a blended
                            learning offer.
                        </p>
                        <p>
                            If you represent an organisation, get in touch at{' '}
                            <a href="mailto:hello@adult-edu.org" className="text-primary-400 hover:text-primary-300">
                                hello@adult-edu.org
                            </a>.
                        </p>
                    </div>
                </section>

                {/* Disclaimer */}
                <section className="mb-10">
                    <div className="rounded-2xl border border-dark-800/60 bg-dark-900/40 px-6 py-5 text-sm leading-6 text-dark-400">
                        AdultEdu is an independent platform. We are not affiliated with any examination board, awarding
                        organisation, or government department. Completion of courses on this platform does not constitute
                        a formal qualification. We are aligned to — but not accredited by — the frameworks we reference.
                    </div>
                </section>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Link to="/tracks" className="btn-primary">Browse pathways</Link>
                    <Link to="/contact" className="btn-secondary">Contact us</Link>
                </div>
            </div>
        </div>
    )
}
