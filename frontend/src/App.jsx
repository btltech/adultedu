import { RouterProvider, createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import MainLayout from './layouts/MainLayout'
import AdminLayout from './layouts/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminDashboard from './pages/admin/Dashboard'
import ContentManager from './pages/admin/ContentManager'
import Users from './pages/admin/Users'
import Settings from './pages/admin/Settings'
import QuestionEditor from './pages/admin/QuestionEditor'
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard'
import OfflineIndicator from './components/OfflineIndicator'
import Home from './pages/Home'
import NotFound from './pages/NotFound'



import Login from './pages/Login'
import Signup from './pages/Signup'
import Tracks from './pages/Tracks'
import TrackDetail from './pages/TrackDetail'
import Topic from './pages/Topic'
import Progress from './pages/Progress'
import Practice from './pages/Practice'
import Lesson from './pages/Lesson'
import Review from './pages/Review'
import Dashboard from './pages/Dashboard'
import LearningLab from './pages/Lab'
import Daily from './pages/Daily'

const router = createBrowserRouter(
    createRoutesFromElements(
        <>
            {/* Public / User Routes */}
            <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/lab" element={<LearningLab />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/tracks" element={<Tracks />} />
                <Route path="/track/:slug" element={<TrackDetail />} />
                <Route path="/topic/:id" element={<Topic />} />
                <Route path="/lesson/:id" element={<Lesson />} />
                <Route path="/practice/:topicId" element={<Practice />} />
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
                {/* 404 Not Found */}
                <Route path="*" element={<NotFound />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="content" element={<ContentManager />} />
                <Route path="users" element={<Users />} />
                <Route path="analytics" element={<AnalyticsDashboard />} />
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
            <RouterProvider
                router={router}
                future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                }}
            />
            <OfflineIndicator />
        </AuthProvider>
    )
}

export default App
