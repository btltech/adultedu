import { Link } from 'react-router-dom'

export default function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="bg-dark-900/50 border-t border-dark-800/50">
            <div className="container-app py-14">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
                    {/* Brand */}
                    <div className="md:col-span-2">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <img
                                src="/logo.png"
                                alt="AdultEdu"
                                className="h-8 w-auto"
                            />
                        </Link>
                        <p className="text-dark-400 text-sm max-w-sm leading-relaxed">
                            Supporting adult learners across the UK with free, quality education
                            aligned to national qualification frameworks.
                        </p>
                    </div>

                    {/* Learning */}
                    <div>
                        <h4 className="font-semibold text-dark-200 text-sm mb-4">Learning</h4>
                        <ul className="space-y-2.5">
                            <li><Link to="/tracks" className="text-dark-400 hover:text-dark-200 text-sm transition-colors">All Courses</Link></li>
                            <li><Link to="/track/essential-digital-skills" className="text-dark-400 hover:text-dark-200 text-sm transition-colors">Digital Skills</Link></li>
                            <li><Link to="/track/gcse-maths" className="text-dark-400 hover:text-dark-200 text-sm transition-colors">GCSE Maths</Link></li>
                            <li><Link to="/track/python-foundations" className="text-dark-400 hover:text-dark-200 text-sm transition-colors">Python</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="font-semibold text-dark-200 text-sm mb-4">Support</h4>
                        <ul className="space-y-2.5">
                            <li><a href="/about" className="text-dark-400 hover:text-dark-200 text-sm transition-colors">About Us</a></li>
                            <li><a href="/contact" className="text-dark-400 hover:text-dark-200 text-sm transition-colors">Contact</a></li>
                            <li><a href="/privacy" className="text-dark-400 hover:text-dark-200 text-sm transition-colors">Privacy</a></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
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

