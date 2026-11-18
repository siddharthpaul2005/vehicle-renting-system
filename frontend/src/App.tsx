import { CarFront } from 'lucide-react'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import { ToastProvider } from './components/Toast'
import { EmptyState } from './components/ui'
import AdminPage from './pages/admin/AdminPage'
import { LoginPage, RegisterPage } from './pages/AuthPages'
import CreditsPage from './pages/CreditsPage'
import HomePage from './pages/HomePage'
import MyBookingsPage from './pages/MyBookingsPage'
import VehicleDetailPage from './pages/VehicleDetailPage'

function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <EmptyState icon={<CarFront className="size-8" />} title="Page not found">
        <Link to="/" className="font-semibold text-amber-700 hover:underline">Go to the homepage</Link>
      </EmptyState>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="vehicles/:id" element={<VehicleDetailPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="credits" element={<CreditsPage />} />
              <Route path="bookings" element={<ProtectedRoute><MyBookingsPage /></ProtectedRoute>} />
              <Route path="admin" element={<ProtectedRoute role="ADMIN"><AdminPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
