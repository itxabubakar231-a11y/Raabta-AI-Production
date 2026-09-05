import { createBrowserRouter, Navigate } from 'react-router-dom'

import Layout from './components/Layout'
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
  {
    path: '/',
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
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'signup',
        element: <SignupPage />,
      },
      {
        path: 'how-it-works',
        element: <HowItWorksPage />,
      },
    ],
  },
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
  {
    path: '*',
    element: <Navigate to="/" replace />,
  }
])

export default router