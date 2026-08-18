import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '../components/Header'
import Footer from '../components/Footer'
import BottomNav from '../components/BottomNav'
import EmailVerificationBanner from '../components/EmailVerificationBanner'
import ErrorBoundary from '../components/ErrorBoundary'
import { SeoProvider } from '../components/SEO'

export default function MainLayout() {
    const location = useLocation()

    return (
        <SeoProvider>
        <div className="min-h-screen flex flex-col relative overflow-x-hidden">
            {/* Without this, a click on a footer link keeps the footer's scroll
                offset and drops the learner into the middle of the new page. */}
            <ScrollRestoration />
            {/* Ambient Spatial Lighting Auras for Depth - purely aesthetic, no color overrides */}
            <div className="pointer-events-none fixed -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-primary-500/10 blur-[120px] -z-10 hidden md:block"></div>
            <div className="pointer-events-none fixed top-[60%] -right-[15%] w-[70vw] h-[70vw] rounded-full bg-accent-500/10 blur-[150px] -z-10 hidden md:block"></div>

            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-white text-dark-900 px-4 py-2 rounded shadow-lg font-bold">
                Skip to Content
            </a>
            
            <Header className="relative z-10" />
            <EmailVerificationBanner />
            
            <main id="main-content" className="flex-grow pb-20 md:pb-0 relative z-0">
                <ErrorBoundary key={location.pathname}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ 
                                duration: 0.35, 
                                ease: [0.22, 1, 0.36, 1] 
                            }}
                            className="h-full"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </ErrorBoundary>
            </main>
            
            <Footer className="relative z-10" />
            <BottomNav />
        </div>
        </SeoProvider>
    )
}
