import { Link } from 'react-router-dom'

const LAST_UPDATED = '12 April 2026'
const CONTACT_EMAIL = 'privacy@adult-edu.org'

function Section({ title, children }) {
    return (
        <section className="mb-10">
            <h2 className="text-xl font-semibold text-dark-50 mb-4">{title}</h2>
            <div className="space-y-4 text-sm leading-7 text-dark-300">{children}</div>
        </section>
    )
}

export default function PrivacyPolicy() {
    return (
        <div className="py-12">
            <div className="container-app max-w-3xl">
                <div className="mb-10">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary-400 mb-3">Legal</p>
                    <h1 className="text-3xl font-bold text-dark-50 mb-3">Privacy Policy</h1>
                    <p className="text-sm text-dark-500">Last updated: {LAST_UPDATED}</p>
                </div>

                <div className="progress-panel mb-8 text-sm leading-7 text-dark-300">
                    This policy explains how AdultEdu collects, uses, and protects your personal data when you use
                    adult-edu.org. We are committed to handling your information responsibly and in line with the
                    UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
                </div>

                <Section title="1. Who we are">
                    <p>
                        AdultEdu operates the platform at adult-edu.org. We are an independent learning platform
                        supporting adult learners across the UK. For data protection purposes, AdultEdu is the data
                        controller for the personal data described in this policy.
                    </p>
                    <p>
                        You can contact us about data matters at{' '}
                        <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary-400 hover:text-primary-300">
                            {CONTACT_EMAIL}
                        </a>.
                    </p>
                </Section>

                <Section title="2. What data we collect">
                    <p>We collect the following categories of personal data:</p>
                    <ul className="ml-4 space-y-2">
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                            <span><strong className="text-dark-200">Account data:</strong> your email address and optional display name when you register.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                            <span><strong className="text-dark-200">Learning activity:</strong> course enrolments, question attempts, correct and incorrect answers, time spent, and progress milestones.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                            <span><strong className="text-dark-200">Onboarding preferences:</strong> learning goals, confidence level, weekly time commitment, and referral source if you provide them.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                            <span><strong className="text-dark-200">Gamification data:</strong> XP points, streaks, achievements, and leaderboard position.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                            <span><strong className="text-dark-200">Session data:</strong> an authentication token stored in a secure, HTTP-only cookie to keep you logged in.</span>
                        </li>
                    </ul>
                    <p>
                        We do not collect payment information, government-issued identification, or sensitive special categories
                        of personal data.
                    </p>
                </Section>

                <Section title="3. How we use your data">
                    <p>We use your data to:</p>
                    <ul className="ml-4 space-y-2">
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                            <span>Provide and maintain your account and personalised learning experience.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                            <span>Track your progress, identify areas for improvement, and display your history.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                            <span>Award achievements, certificates, and XP as part of the platform's learning features.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                            <span>Generate anonymised partner and cohort reports where you have been referred by an organisation.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                            <span>Improve the platform through aggregate, anonymised usage analysis.</span>
                        </li>
                    </ul>
                    <p>
                        We do not sell your personal data. We do not use your data for targeted advertising.
                        We do not send marketing emails.
                    </p>
                </Section>

                <Section title="4. Legal basis for processing">
                    <p>Under UK GDPR, we process your data on the following legal bases:</p>
                    <ul className="ml-4 space-y-2">
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                            <span><strong className="text-dark-200">Contract:</strong> to provide the service you signed up for, including your account, progress tracking, and certificates.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                            <span><strong className="text-dark-200">Legitimate interests:</strong> to improve the platform, prevent fraud, and maintain platform security.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                            <span><strong className="text-dark-200">Legal obligation:</strong> where required to comply with applicable UK law.</span>
                        </li>
                    </ul>
                </Section>

                <Section title="5. Cookies">
                    <p>We use the following cookies:</p>
                    <ul className="ml-4 space-y-2">
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                            <span><strong className="text-dark-200">session</strong> — a secure, HTTP-only authentication cookie that keeps you logged in for up to 7 days. Strictly necessary.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                            <span><strong className="text-dark-200">XSRF-TOKEN</strong> — a security token to protect your account from cross-site request forgery. Strictly necessary.</span>
                        </li>
                    </ul>
                    <p>
                        We do not use tracking, analytics, or advertising cookies. See our{' '}
                        <Link to="/cookies" className="text-primary-400 hover:text-primary-300">Cookie Policy</Link> for
                        full details.
                    </p>
                </Section>

                <Section title="6. Data retention">
                    <p>
                        We keep your account data for as long as your account is active. If you request deletion of your
                        account, we will remove your personal data within 30 days, except where we are required to retain
                        certain records by law.
                    </p>
                    <p>
                        Anonymised or aggregated learning data that cannot identify you may be retained indefinitely for
                        platform improvement purposes.
                    </p>
                </Section>

                <Section title="7. Sharing your data">
                    <p>
                        We do not sell or share your personal data with third parties for their own purposes. We use the
                        following essential service providers:
                    </p>
                    <ul className="ml-4 space-y-2">
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                            <span><strong className="text-dark-200">Railway</strong> — cloud hosting and database infrastructure for the backend.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                            <span><strong className="text-dark-200">Cloudflare</strong> — content delivery and DDoS protection for the frontend.</span>
                        </li>
                    </ul>
                    <p>
                        Where you are referred by a partner organisation (such as a library, council, or training provider),
                        that organisation may receive a summary report of your learning activity — including completed topics,
                        certificates, and confidence progress — as part of their delivery reporting. This will be made clear
                        during onboarding if it applies to you.
                    </p>
                </Section>

                <Section title="8. Your rights">
                    <p>Under UK GDPR, you have the following rights:</p>
                    <ul className="ml-4 space-y-2">
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                            <span><strong className="text-dark-200">Access:</strong> the right to request a copy of the personal data we hold about you.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                            <span><strong className="text-dark-200">Rectification:</strong> the right to correct inaccurate data.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                            <span><strong className="text-dark-200">Erasure:</strong> the right to request deletion of your account and personal data.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                            <span><strong className="text-dark-200">Portability:</strong> the right to receive a copy of your data in a structured, machine-readable format.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                            <span><strong className="text-dark-200">Objection:</strong> the right to object to processing based on legitimate interests.</span>
                        </li>
                    </ul>
                    <p>
                        To exercise any of these rights, email us at{' '}
                        <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary-400 hover:text-primary-300">
                            {CONTACT_EMAIL}
                        </a>. We will respond within 30 days.
                    </p>
                    <p>
                        You also have the right to lodge a complaint with the UK Information Commissioner's Office (ICO) at{' '}
                        <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300">
                            ico.org.uk
                        </a>.
                    </p>
                </Section>

                <Section title="9. Security">
                    <p>
                        We protect your data using industry-standard measures including encrypted HTTPS connections, hashed
                        password storage, HTTP-only session cookies, and CSRF protection on all mutating requests. No system
                        is completely secure, but we take reasonable steps to protect your information.
                    </p>
                </Section>

                <Section title="10. Changes to this policy">
                    <p>
                        We may update this policy from time to time. When we do, we will update the date at the top of this
                        page. Continued use of the platform after changes are published constitutes acceptance of the updated
                        policy.
                    </p>
                </Section>

                <div className="pt-8 border-t border-dark-800/50 flex flex-col sm:flex-row gap-4 text-sm text-dark-400">
                    <Link to="/terms" className="hover:text-dark-200 transition-colors">Terms of Use</Link>
                    <Link to="/cookies" className="hover:text-dark-200 transition-colors">Cookie Policy</Link>
                    <Link to="/contact" className="hover:text-dark-200 transition-colors">Contact us</Link>
                </div>
            </div>
        </div>
    )
}
