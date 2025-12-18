import { Component } from 'react'
import { Link } from 'react-router-dom'

/**
 * Error boundary component to catch JavaScript errors anywhere in the child component tree.
 * Displays a fallback UI instead of crashing the whole app.
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render shows the fallback UI.
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        // Log the error to console (could be sent to a logging service)
        console.error('ErrorBoundary caught an error:', error, errorInfo)
        this.setState({ errorInfo })
    }

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            return (
                <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
                    <div className="text-center max-w-md">
                        <div className="text-6xl mb-6">⚠️</div>
                        <h1 className="text-2xl font-bold text-dark-50 mb-4">
                            Something went wrong
                        </h1>
                        <p className="text-dark-400 mb-6">
                            We encountered an error while loading this page.
                            Please try again or go back to the homepage.
                        </p>
                        {import.meta.env.DEV && this.state.error && (
                            <details className="text-left mb-6 p-4 bg-dark-800 rounded-xl text-sm">
                                <summary className="text-red-400 cursor-pointer mb-2">
                                    Error Details (Dev Only)
                                </summary>
                                <pre className="text-dark-300 whitespace-pre-wrap overflow-auto max-h-48">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => window.location.reload()}
                                className="btn-secondary"
                            >
                                Refresh Page
                            </button>
                            <Link to="/" className="btn-primary">
                                Go Home
                            </Link>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
