import { Link } from 'react-router-dom'

export default function NotFound() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
            <div className="text-center">
                <div className="text-8xl mb-6">🔍</div>
                <h1 className="text-4xl font-bold text-dark-50 mb-4">Page Not Found</h1>
                <p className="text-dark-400 mb-8 max-w-md mx-auto">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/" className="btn-primary">
                        Go Home
                    </Link>
                    <Link to="/tracks" className="btn-secondary">
                        Browse Courses
                    </Link>
                </div>
            </div>
        </div>
    )
}
