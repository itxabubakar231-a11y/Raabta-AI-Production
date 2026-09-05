import { createBrowserRouter, Navigate } from 'react-router-dom'

import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import HomePage from './pages/HomePage'
import SubmitComplaintPage from './pages/SubmitComplaintPage'
import TrackComplaintPage from './pages/TrackComplaintPage'
import ReportDetailPage from './pages/ReportDetailPage'
import DepartmentPage from './pages/DepartmentPage'
import InsightsPage from './pages/InsightsPage'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import HowItWorksPage from './pages/HowItWorksPage'

const router = createBrowserRouter([
  // 1. Public Landing Page (Zero portal access without auth)
  {
    path: '/',
    element: <LandingPage />,
  },
  // 2. Public Authentication Routes
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
  // 3. Application Portal Dashboard (Protected)
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'submit',
        element: <SubmitComplaintPage />,
      },
      {
        path: 'track',
        element: <TrackComplaintPage />,
      },
      {
        path: 'report/:id',
        element: <ReportDetailPage />,
      },
      {
        path: 'insights',
        element: <InsightsPage />,
      },
      {
        path: 'how-it-works',
        element: <HowItWorksPage />,
      },
      {
        path: 'department',
        element: (
          <ProtectedRoute allowedRoles={['officer', 'admin']}>
            <DepartmentPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  // 4. Direct Portal Routes for Seamless Deep-linking (Protected & Role-Guarded)
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'submit',
        element: <SubmitComplaintPage />,
      },
      {
        path: 'track',
        element: <TrackComplaintPage />,
      },
      {
        path: 'report/:id',
        element: <ReportDetailPage />,
      },
      {
        path: 'insights',
        element: <InsightsPage />,
      },
      {
        path: 'how-it-works',
        element: <HowItWorksPage />,
      },
      {
        path: 'department',
        element: (
          <ProtectedRoute allowedRoles={['officer', 'admin']}>
            <DepartmentPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  // 5. Wildcard Fallback
  {
    path: '*',
    element: <Navigate to="/" replace />,
  }
])

export default router