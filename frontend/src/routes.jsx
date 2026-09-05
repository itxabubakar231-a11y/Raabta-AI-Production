import { createBrowserRouter, Navigate } from 'react-router-dom'

import Layout from './components/Layout'
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
  // Public Landing Page as root default
  {
    path: '/',
    element: <LandingPage />,
  },
  // Public Authentication
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
  // Application Portal (under Layout shell)
  {
    path: '/app',
    element: <Layout />,
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
        path: 'department',
        element: <DepartmentPage />,
      },
      {
        path: 'insights',
        element: <InsightsPage />,
      },
      {
        path: 'admin',
        element: <AdminPage />,
      },
      {
        path: 'how-it-works',
        element: <HowItWorksPage />,
      },
    ],
  },
  // Direct portal routes for seamless deep-linking
  {
    path: '/',
    element: <Layout />,
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
        path: 'department',
        element: <DepartmentPage />,
      },
      {
        path: 'insights',
        element: <InsightsPage />,
      },
      {
        path: 'admin',
        element: <AdminPage />,
      },
      {
        path: 'how-it-works',
        element: <HowItWorksPage />,
      },
    ],
  },
  // Wildcard fallback
  {
    path: '*',
    element: <Navigate to="/" replace />,
  }
])

export default router