import { createBrowserRouter, Navigate } from 'react-router-dom'

import ProtectedRoute from './components/ProtectedRoute'
import CitizenLayout from './components/CitizenLayout'
import GovernmentLayout from './components/GovernmentLayout'

// Public Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

// Citizen Pages (/app/*)
import HomePage from './pages/HomePage'
import CitizenReportWizard from './pages/CitizenReportWizard'
import TrackComplaintPage from './pages/TrackComplaintPage'
import ReportDetailPage from './pages/ReportDetailPage'
import CitizenProblemMapPage from './pages/CitizenProblemMapPage'
import SettingsPage from './pages/SettingsPage'
import HowItWorksPage from './pages/HowItWorksPage'

// Government Pages (/gov/*)
import GovDashboardPage from './pages/gov/GovDashboardPage'
import GovQueuePage from './pages/gov/GovQueuePage'
import GovReportDetailPage from './pages/gov/GovReportDetailPage'
import GovRepeatedProblemsPage from './pages/gov/GovRepeatedProblemsPage'
import GovProblemMapPage from './pages/gov/GovProblemMapPage'
import GovInsightsPage from './pages/gov/GovInsightsPage'
import GovDepartmentsPage from './pages/gov/GovDepartmentsPage'
import GovUsersPage from './pages/gov/GovUsersPage'
import GovActivityLogPage from './pages/gov/GovActivityLogPage'

const router = createBrowserRouter([
  // 1. Public Landing Page
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
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },

  // 3. Citizen Portal (/app/*) — Protected
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <CitizenLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'report',
        element: <CitizenReportWizard />,
      },
      {
        path: 'submit',
        element: <Navigate to="/app/report" replace />,
      },
      {
        path: 'reports',
        element: <TrackComplaintPage />,
      },
      {
        path: 'track',
        element: <Navigate to="/app/reports" replace />,
      },
      {
        path: 'reports/:id',
        element: <ReportDetailPage />,
      },
      {
        path: 'report/:id',
        element: <ReportDetailPage />,
      },
      {
        path: 'map',
        element: <CitizenProblemMapPage />,
      },
      {
        path: 'how-it-works',
        element: <HowItWorksPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },

  // 4. Government Portal (/gov/*) — Protected & Role Guarded (officer, admin)
  {
    path: '/gov',
    element: (
      <ProtectedRoute allowedRoles={['officer', 'admin']}>
        <GovernmentLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <GovDashboardPage />,
      },
      {
        path: 'queue',
        element: <GovQueuePage />,
      },
      {
        path: 'reports',
        element: <GovQueuePage />,
      },
      {
        path: 'reports/:id',
        element: <GovReportDetailPage />,
      },
      {
        path: 'repeated',
        element: <GovRepeatedProblemsPage />,
      },
      {
        path: 'map',
        element: <GovProblemMapPage />,
      },
      {
        path: 'insights',
        element: <GovInsightsPage />,
      },
      {
        path: 'response-times',
        element: <GovInsightsPage />,
      },
      {
        path: 'departments',
        element: <GovDepartmentsPage />,
      },
      {
        path: 'users',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <GovUsersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'activity',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <GovActivityLogPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },

  // 5. Legacy Route Redirects (for deep links and bookmarks)
  {
    path: '/submit',
    element: <Navigate to="/app/report" replace />,
  },
  {
    path: '/track',
    element: <Navigate to="/app/reports" replace />,
  },
  {
    path: '/report/:id',
    element: <ReportDetailPage />,
  },
  {
    path: '/department',
    element: <Navigate to="/gov/queue" replace />,
  },
  {
    path: '/admin',
    element: <Navigate to="/gov/users" replace />,
  },
  {
    path: '/insights',
    element: <Navigate to="/gov/insights" replace />,
  },

  // 6. Wildcard Fallback
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])

export default router