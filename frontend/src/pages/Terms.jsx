import { Link } from 'react-router-dom'

const LAST_UPDATED = '12 April 2026'

function Section({ title, children }) {
    return (
        <section className="mb-10">
            <h2 className="text-xl font-semibold text-dark-50 mb-4">{title}</h2>
            <div className="space-y-4 text-sm leading-7 text-dark-300">{children}</div>
        </section>
    )
}

export default function Terms() {
    return (
        <div className="py-12">
            <div className="container-app max-w-3xl">
                <div className="mb-10">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary-400 mb-3">Legal</p>
                    <h1 className="text-3xl font-bold text-dark-50 mb-3">Terms of Use</h1>
                    <p className="text-sm text-dark-500">Last updated: {LAST_UPDATED}</p>
                </div>

                <div className="progress-panel mb-8 text-sm leading-7 text-dark-300">
                    By creating an account or using adult-edu.org, you agree to these Terms of Use. Please read them
                    carefully. If you do not agree, do not use the platform.
                </div>

                <Section title="1. About AdultEdu">
                    <p>
                        AdultEdu is an independent online learning platform at adult-edu.org, designed to support adult
                        learners across the UK with structured courses, guided practice, and progress tracking. The platform
                        is aligned to UK learning frameworks including Essential Digital Skills, Functional Skills, GCSE
                        preparation, and Life in the UK citizenship preparation.
                    </p>
                    <p>
                        AdultEdu is not affiliated with, endorsed by, or accredited by any examination board, awarding body,
                        or government department. Completion of courses and practice questions on this platform does not
                        constitute a formal qualification.
                    </p>
                </Section>

                <Section title="2. Eligibility">
                    <p>
                        You must be at least 13 years old to create an account. By registering, you confirm that you meet
                        this requirement. If you are under 16, you should have the consent of a parent or guardian before
                        using the platform.
                    </p>
                    <p>
                        AdultEdu is primarily designed for adult learners aged 18 and over. Use by younger learners is
                        permitted but the platform is not specifically designed for under-16s.
                    </p>
                </Section>

                <Section title="3. Your account">
                    <p>
                        You are responsible for maintaining the security of your account credentials. Do not share your
                        password with anyone. If you suspect unauthorised access to your account, contact us immediately at{' '}
                        <a href="mailto:hello@adult-edu.org" className="text-primary-400 hover:text-primary-300">
                            hello@adult-edu.org
                        </a>.
                    </p>
                    <p>
                        You may not create multiple accounts to circumvent restrictions, manipulate leaderboard standings,
                        or misrepresent your identity.
                    </p>
                </Section>

                <Section title="4. Acceptable use">
                    <p>You agree to use AdultEdu only for lawful, personal, non-commercial learning purposes. You must not:</p>
                    <ul className="ml-4 space-y-2">
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                            <span>Attempt to access, scrape, or extract platform content or question banks beyond normal use.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                            <span>Interfere with or disrupt the platform, its servers, or its security measures.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                            <span>Attempt to reverse-engineer, copy, or redistribute any part of the platform or its content.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                            <span>Use automated tools, bots, or scripts to interact with the platform.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                            <span>Represent that your practice performance on this platform constitutes a formal qualification.</span>
                        </li>
                    </ul>
                </Section>

                <Section title="5. Intellectual property">
                    <p>
                        All content on AdultEdu — including course materials, lesson text, practice questions, explanations,
                        design, and code — is owned by AdultEdu or its licensors and protected by copyright. You may use
                        content for your own personal learning only.
                    </p>
                    <p>
                        Certificates issued by AdultEdu are non-transferable and reflect your performance on this platform.
                        They are not formal qualifications and must not be misrepresented as such.
                    </p>
                </Section>

                <Section title="6. No guarantee of outcomes">
                    <p>
                        AdultEdu provides a structured learning environment with practice content aligned to UK frameworks.
                        We do not guarantee that use of the platform will result in passing any external examination,
                        gaining employment, or meeting any official qualification standard.
                    </p>
                    <p>
                        The platform is provided as-is. We aim for high availability but cannot guarantee uninterrupted access.
                    </p>
                </Section>

                <Section title="7. User data and privacy">
                    <p>
                        Your use of AdultEdu is also governed by our{' '}
                        <Link to="/privacy-policy" className="text-primary-400 hover:text-primary-300">Privacy Policy</Link>,
                        which is incorporated into these Terms by reference. By using the platform, you consent to our data
                        practices as described there.
                    </p>
                </Section>

                <Section title="8. Account termination">
                    <p>
                        You may delete your account at any time by contacting us at{' '}
                        <a href="mailto:hello@adult-edu.org" className="text-primary-400 hover:text-primary-300">
                            hello@adult-edu.org
                        </a>. We reserve the right to suspend or terminate accounts that violate these Terms.
                    </p>
                </Section>

                <Section title="9. Changes to these Terms">
                    <p>
                        We may update these Terms from time to time. We will update the date at the top of this page when
                        changes are made. Continued use of the platform after changes are published constitutes acceptance
                        of the updated Terms.
                    </p>
                </Section>

                <Section title="10. Governing law">
                    <p>
                        These Terms are governed by the laws of England and Wales. Any disputes will be subject to the
                        exclusive jurisdiction of the courts of England and Wales.
                    </p>
                </Section>

                <div className="pt-8 border-t border-dark-800/50 flex flex-col sm:flex-row gap-4 text-sm text-dark-400">
                    <Link to="/privacy-policy" className="hover:text-dark-200 transition-colors">Privacy Policy</Link>
                    <Link to="/cookies" className="hover:text-dark-200 transition-colors">Cookie Policy</Link>
                    <Link to="/contact" className="hover:text-dark-200 transition-colors">Contact us</Link>
                </div>
            </div>
        </div>
    )
}
