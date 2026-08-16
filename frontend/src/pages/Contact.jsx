import { Mail, MessageSquare } from 'lucide-react'
import { Link } from 'react-router-dom'

const GENERAL_EMAIL = 'hello@adult-edu.org'
const PRIVACY_EMAIL = 'privacy@adult-edu.org'

export default function Contact() {
    return (
        <div className="py-12">
            <div className="container-app max-w-3xl">
                <div className="mb-10">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary-400 mb-3">Get in touch</p>
                    <h1 className="text-3xl font-bold text-dark-50 mb-3">Contact us</h1>
                    <p className="text-dark-300 text-base leading-7 max-w-2xl">
                        We are a small team. If you have a question, a problem with the platform, or a data request,
                        email is the best way to reach us. We aim to respond within 2 working days.
                    </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 mb-10">
                    <a
                        href={`mailto:${GENERAL_EMAIL}`}
                        className="feature-panel group hover:border-primary-500/40 transition-all"
                    >
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/12 text-primary-300 mb-4">
                            <Mail className="h-5 w-5" />
                        </div>
                        <h2 className="text-lg font-semibold text-dark-50 group-hover:text-primary-300 transition-colors mb-2">
                            General enquiries
                        </h2>
                        <p className="text-sm text-dark-400 mb-4 leading-6">
                            Questions about pathways, your account, technical issues, or any other matter.
                        </p>
                        <span className="text-sm font-medium text-primary-400">{GENERAL_EMAIL}</span>
                    </a>

                    <a
                        href={`mailto:${PRIVACY_EMAIL}`}
                        className="feature-panel group hover:border-primary-500/40 transition-all"
                    >
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-500/12 text-accent-300 mb-4">
                            <MessageSquare className="h-5 w-5" />
                        </div>
                        <h2 className="text-lg font-semibold text-dark-50 group-hover:text-primary-300 transition-colors mb-2">
                            Data and privacy
                        </h2>
                        <p className="text-sm text-dark-400 mb-4 leading-6">
                            Data access requests, account deletion, or any question about how we use your information.
                        </p>
                        <span className="text-sm font-medium text-accent-400">{PRIVACY_EMAIL}</span>
                    </a>
                </div>

                <div className="progress-panel text-sm leading-7 text-dark-300 space-y-3">
                    <p className="font-medium text-dark-200">Organisations and partners</p>
                    <p>
                        If you are a library, council, college, or employability provider interested in using AdultEdu
                        to support your learners, email{' '}
                        <a href={`mailto:${GENERAL_EMAIL}`} className="text-primary-400 hover:text-primary-300">{GENERAL_EMAIL}</a> with
                        a brief description of your organisation and what you are looking for.
                    </p>
                </div>

                <div className="mt-10 pt-8 border-t border-dark-800/50 flex flex-col sm:flex-row gap-4 text-sm text-dark-400">
                    <Link to="/privacy-policy" className="hover:text-dark-200 transition-colors">Privacy Policy</Link>
                    <Link to="/terms" className="hover:text-dark-200 transition-colors">Terms of Use</Link>
                    <Link to="/accessibility" className="hover:text-dark-200 transition-colors">Accessibility</Link>
                </div>
            </div>
        </div>
    )
}
