import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import BottomNav from '../components/BottomNav'
import ErrorBoundary from '../components/ErrorBoundary'

export default function MainLayout() {
    return (
        <div className="min-h-screen flex flex-col">
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-white text-dark-900 px-4 py-2 rounded shadow-lg font-bold">
                Skip to Content
            </a>
            <Header />
            <main id="main-content" className="flex-grow pb-20 md:pb-0">
                <ErrorBoundary>
                    <Outlet />
                </ErrorBoundary>
            </main>
            <Footer />
            <BottomNav />
        </div>
    )
}
