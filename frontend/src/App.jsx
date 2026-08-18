import { Suspense, lazy } from 'react'
import { RouterProvider, createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import MainLayout from './layouts/MainLayout'
import AdminLayout from './layouts/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'
import OfflineIndicator from './components/OfflineIndicator'
import { CardGridSkeleton } from './components/Skeleton'

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const ContentManager = lazy(() => import('./pages/admin/ContentManager'))
const Users = lazy(() => import('./pages/admin/Users'))
const Settings = lazy(() => import('./pages/admin/Settings'))
const QuestionEditor = lazy(() => import('./pages/admin/QuestionEditor'))
const AnalyticsDashboard = lazy(() => import('./pages/admin/AnalyticsDashboard'))
const PartnerDelivery = lazy(() => import('./pages/admin/PartnerDelivery'))
const QuestionReports = lazy(() => import('./pages/admin/QuestionReports'))
const Home = lazy(() => import('./pages/Home'))
const NotFound = lazy(() => import('./pages/NotFound'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const Terms = lazy(() => import('./pages/Terms'))
const Contact = lazy(() => import('./pages/Contact'))
const About = lazy(() => import('./pages/About'))
const Accessibility = lazy(() => import('./pages/Accessibility'))
const CookiePolicy = lazy(() => import('./pages/CookiePolicy'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Tracks = lazy(() => import('./pages/Tracks'))
const TrackDetail = lazy(() => import('./pages/TrackDetail'))
const Topic = lazy(() => import('./pages/Topic'))
const Progress = lazy(() => import('./pages/Progress'))
const Practice = lazy(() => import('./pages/Practice'))
const LifeInUkTest = lazy(() => import('./pages/LifeInUkTest'))
const Lesson = lazy(() => import('./pages/Lesson'))
const Review = lazy(() => import('./pages/Review'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Daily = lazy(() => import('./pages/Daily'))
const StartingPoint = lazy(() => import('./pages/StartingPoint'))

function RouteFallback() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container-app py-12">
                <CardGridSkeleton count={3} />
            </div>
        </div>
    )
}

const router = createBrowserRouter(
    createRoutesFromElements(
        <>
            {/* Public / User Routes */}
            <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/tracks" element={<Tracks />} />
                <Route path="/life-in-the-uk-test" element={<LifeInUkTest />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/about" element={<About />} />
                <Route path="/accessibility" element={<Accessibility />} />
                <Route path="/cookies" element={<CookiePolicy />} />
                <Route path="/track/:slug" element={<TrackDetail />} />
                <Route path="/topic/:id" element={<Topic />} />
                <Route path="/lesson/:id" element={<Lesson />} />
                <Route path="/practice/:topicId" element={
                    <ProtectedRoute>
                        <Practice />
                    </ProtectedRoute>
                } />
                <Route path="/progress" element={
                    <ProtectedRoute>
                        <Progress />
                    </ProtectedRoute>
                } />
                <Route path="/review" element={
                    <ProtectedRoute>
                        <Review />
                    </ProtectedRoute>
                } />
                <Route path="/daily" element={
                    <ProtectedRoute>
                        <Daily />
                    </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                } />
                <Route path="/start" element={<StartingPoint />} />
                {/* 404 Not Found */}
                <Route path="*" element={<NotFound />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="content" element={<ContentManager />} />
                <Route path="users" element={<Users />} />
                <Route path="analytics" element={<AnalyticsDashboard />} />
                <Route path="partners" element={<PartnerDelivery />} />
                <Route path="question-reports" element={<QuestionReports />} />
                <Route path="settings" element={<Settings />} />
                <Route path="questions/new" element={<QuestionEditor />} />
                <Route path="questions/:id" element={<QuestionEditor />} />
            </Route>
        </>
    ),
    {
        future: {
            v7_startTransition: true,
            v7_relativeSplatPath: true,
        }
    }
)

function App() {
    return (
        <AuthProvider>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#27272a',
                        color: '#fafafa',
                        border: '1px solid #3f3f46',
                        borderRadius: '12px',
                    },
                    success: {
                        iconTheme: { primary: '#14b8a6', secondary: '#fafafa' },
                    },
                    error: {
                        iconTheme: { primary: '#ef4444', secondary: '#fafafa' },
                    },
                }}
            />
            <Suspense fallback={<RouteFallback />}>
                <RouterProvider
                    router={router}
                    future={{
                        v7_startTransition: true,
                        v7_relativeSplatPath: true,
                    }}
                />
            </Suspense>
            <OfflineIndicator />
        </AuthProvider>
    )
}

export default App
