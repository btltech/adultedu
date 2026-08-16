import { Link } from 'react-router-dom'

export default function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="bg-dark-900/50 border-t border-dark-800/50">
            <div className="container-app py-14">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-10">
                    <div className="md:col-span-2">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <img
                                src="/logo.svg"
                                alt="AdultEdu"
                                className="h-12 w-auto"
                            />
                        </Link>
                        <p className="text-dark-400 text-sm max-w-sm leading-relaxed">
                            Supporting adult learners across the UK with structured pathways,
                            guided practice, and progress tools aligned to recognised learning pathways.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-semibold text-dark-200 text-sm mb-4">Learn</h4>
                        <ul className="space-y-2.5">
                            <li><Link to="/tracks" className="text-dark-400 hover:text-dark-200 text-sm transition-colors">All Pathways</Link></li>
                            <li><Link to="/life-in-the-uk-test" className="text-dark-400 hover:text-dark-200 text-sm transition-colors">Free Life in the UK Test</Link></li>
                            <li><Link to="/track/essential-digital-skills" className="text-dark-400 hover:text-dark-200 text-sm transition-colors">Digital Skills</Link></li>
                            <li><Link to="/track/gcse-maths" className="text-dark-400 hover:text-dark-200 text-sm transition-colors">GCSE Maths</Link></li>
                            <li><Link to="/track/python-foundations" className="text-dark-400 hover:text-dark-200 text-sm transition-colors">Python</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-dark-200 text-sm mb-4">Browse</h4>
                        <ul className="space-y-2.5">
                            <li><Link to="/tracks?category=qual_prep" className="text-dark-400 hover:text-dark-200 text-sm transition-colors">Qualification Prep</Link></li>
                            <li><Link to="/tracks?category=workplace" className="text-dark-400 hover:text-dark-200 text-sm transition-colors">Workplace Skills</Link></li>
                            <li><Link to="/tracks?category=tech" className="text-dark-400 hover:text-dark-200 text-sm transition-colors">Tech Pathways</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-dark-200 text-sm mb-4">Company</h4>
                        <ul className="space-y-2.5">
                            <li><Link to="/about" className="text-dark-400 hover:text-dark-200 text-sm transition-colors">About</Link></li>
                            <li><Link to="/contact" className="text-dark-400 hover:text-dark-200 text-sm transition-colors">Contact</Link></li>
                            <li><Link to="/privacy-policy" className="text-dark-400 hover:text-dark-200 text-sm transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="text-dark-400 hover:text-dark-200 text-sm transition-colors">Terms of Use</Link></li>
                            <li><Link to="/accessibility" className="text-dark-400 hover:text-dark-200 text-sm transition-colors">Accessibility</Link></li>
                            <li><Link to="/cookies" className="text-dark-400 hover:text-dark-200 text-sm transition-colors">Cookies</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-dark-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-dark-500 text-xs">
                        © {currentYear} AdultEdu. All rights reserved.
                    </p>
                    <p className="text-dark-500 text-xs text-center sm:text-right max-w-lg">
                        Independent platform aligned to UK frameworks. Not affiliated with exam boards.
                    </p>
                </div>
            </div>
        </footer>
    )
}

