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

export default function CookiePolicy() {
    return (
        <div className="py-12">
            <div className="container-app max-w-3xl">
                <div className="mb-10">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary-400 mb-3">Legal</p>
                    <h1 className="text-3xl font-bold text-dark-50 mb-3">Cookie Policy</h1>
                    <p className="text-sm text-dark-500">Last updated: {LAST_UPDATED}</p>
                </div>

                <div className="progress-panel mb-8 text-sm leading-7 text-dark-300">
                    This policy explains what cookies AdultEdu uses, why we use them, and how you can control them.
                    We keep our cookie use minimal — we only set cookies that are strictly necessary to run the service.
                </div>

                <Section title="What are cookies?">
                    <p>
                        Cookies are small text files that a website places on your device when you visit. They allow the
                        site to recognise your device on subsequent requests and remember information such as whether you
                        are logged in.
                    </p>
                </Section>

                <Section title="Cookies we set">
                    <p>AdultEdu sets the following first-party cookies. We do not use any third-party tracking or advertising cookies.</p>

                    <div className="mt-4 space-y-4">
                        <div className="feature-panel">
                            <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-2">
                                <span className="text-dark-50 font-semibold font-mono text-xs bg-dark-700/60 px-2 py-1 rounded w-fit">session</span>
                                <span className="text-xs text-accent-300 uppercase tracking-widest">Strictly Necessary</span>
                            </div>
                            <p className="text-sm leading-7 text-dark-300">
                                This cookie keeps you logged in. It is set when you sign in and cleared when you sign out or after
                                7 days of inactivity. It is HttpOnly (not accessible to JavaScript) and sent only over HTTPS.
                                Without this cookie the platform cannot work.
                            </p>
                            <p className="text-xs text-dark-500 mt-2">Duration: 7 days &nbsp;·&nbsp; Scope: adut-edu.org</p>
                        </div>

                        <div className="feature-panel">
                            <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-2">
                                <span className="text-dark-50 font-semibold font-mono text-xs bg-dark-700/60 px-2 py-1 rounded w-fit">XSRF-TOKEN</span>
                                <span className="text-xs text-accent-300 uppercase tracking-widest">Strictly Necessary</span>
                            </div>
                            <p className="text-sm leading-7 text-dark-300">
                                This cookie holds a security token used to protect against Cross-Site Request Forgery (CSRF)
                                attacks. It is read by the browser and included in requests that change data (POST, PUT, DELETE).
                                It is not tracked and contains no personal information.
                            </p>
                            <p className="text-xs text-dark-500 mt-2">Duration: Session &nbsp;·&nbsp; Scope: adut-edu.org</p>
                        </div>
                    </div>
                </Section>

                <Section title="Cookies we do not use">
                    <p>We do not set cookies for any of the following purposes:</p>
                    <ul className="ml-4 space-y-2">
                        {[
                            'Analytics or performance tracking (e.g. Google Analytics, Hotjar)',
                            'Advertising or remarketing',
                            'Social media personalisation',
                            'A/B testing or experimentation',
                            'Third-party embeds that set their own cookies',
                        ].map((item) => (
                            <li key={item} className="flex gap-3">
                                <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-dark-600" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </Section>

                <Section title="Do I need to give consent?">
                    <p>
                        Under UK and EU law, cookies that are strictly necessary for a service to function do not require
                        your consent. Because every cookie listed above is essential to keeping you securely logged in,
                        we do not display a cookie consent banner. If we ever add non-essential cookies we will update
                        this policy and add appropriate consent controls.
                    </p>
                </Section>

                <Section title="How to control cookies">
                    <p>
                        You can instruct your browser to block or delete all cookies at any time through its settings.
                        Please note that if you block the session cookie you will not be able to stay logged in.
                    </p>
                    <p>
                        Browser instructions:{' '}
                        <a
                            href="https://support.google.com/chrome/answer/95647"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-400 hover:text-primary-300"
                        >
                            Chrome
                        </a>
                        {' · '}
                        <a
                            href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-400 hover:text-primary-300"
                        >
                            Firefox
                        </a>
                        {' · '}
                        <a
                            href="https://support.apple.com/en-gb/guide/safari/sfri11471/mac"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-400 hover:text-primary-300"
                        >
                            Safari
                        </a>
                        {' · '}
                        <a
                            href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-400 hover:text-primary-300"
                        >
                            Edge
                        </a>
                    </p>
                </Section>

                <Section title="Changes to this policy">
                    <p>
                        We may update this policy if we change how we use cookies. The date at the top of this page will
                        reflect any changes. If we add non-essential cookies we will notify signed-in users by email.
                    </p>
                </Section>

                <Section title="Contact">
                    <p>
                        Questions about our cookie use?{' '}
                        <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary-400 hover:text-primary-300">
                            {CONTACT_EMAIL}
                        </a>
                    </p>
                </Section>

                <div className="pt-8 border-t border-dark-800/50 flex flex-col sm:flex-row gap-4 text-sm text-dark-400">
                    <Link to="/privacy-policy" className="hover:text-dark-200 transition-colors">Privacy Policy</Link>
                    <Link to="/terms" className="hover:text-dark-200 transition-colors">Terms of Use</Link>
                    <Link to="/contact" className="hover:text-dark-200 transition-colors">Contact us</Link>
                </div>
            </div>
        </div>
    )
}
