import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Landing page components
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import HowItWorks from './components/HowItWorks'
import AccountabilityPartner from './components/AccountabilityPartner'
import TodayView from './components/TodayView'
import MarkAttendance from './components/MarkAttendance'
import Differentiation from './components/Differentiation'
import EmotionalStatement from './components/EmotionalStatement'
import Waitlist from './components/Waitlist'
import Footer from './components/Footer'

// Auth components
import { ProtectedRoute } from './components/auth'
import Login from './pages/Login'

// Dashboard layout and pages (core pages loaded eagerly)
import { DashboardLayout, AdminLayout } from './components/layout'
import Dashboard from './pages/Dashboard'
import Rooms from './pages/Rooms'
import RoomDetail from './pages/RoomDetail'
import AttendanceRoom from './pages/AttendanceRoom'

// Lazy-loaded pages (loaded on demand for faster initial load)
const History = lazy(() => import('./pages/History'))
const Profile = lazy(() => import('./pages/Profile'))
const Settings = lazy(() => import('./pages/Settings'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Gallery = lazy(() => import('./pages/Gallery'))
const Leaderboard = lazy(() => import('./pages/Leaderboard'))
const Challenges = lazy(() => import('./pages/Challenges'))
const Feed = lazy(() => import('./pages/Feed'))

// Admin pages (lazy)
const AdminJoin = lazy(() => import('./pages/admin').then(m => ({ default: m.AdminJoin })))
const AdminDashboard = lazy(() => import('./pages/admin').then(m => ({ default: m.AdminDashboard })))
const AdminRooms = lazy(() => import('./pages/admin').then(m => ({ default: m.AdminRooms })))
const AdminRoomDetail = lazy(() => import('./pages/admin').then(m => ({ default: m.AdminRoomDetail })))
const AdminSettings = lazy(() => import('./pages/admin').then(m => ({ default: m.AdminSettings })))
const AdminAnalytics = lazy(() => import('./pages/admin').then(m => ({ default: m.AdminAnalytics })))
const AdminUserAnalytics = lazy(() => import('./pages/admin').then(m => ({ default: m.AdminUserAnalytics })))

// Loading fallback for lazy routes
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  )
}

// Landing Page Component
function LandingPage() {
  return (
    <div className="min-h-screen bg-charcoal-900">
      <Navbar />
      <Hero />
      <HowItWorks />
      <AccountabilityPartner />
      <TodayView />
      <MarkAttendance />
      <Differentiation />
      <EmotionalStatement />
      <Waitlist />
      <Footer />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Dashboard Routes */}
          <Route element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/rooms/attendance" element={<AttendanceRoom />} />
            <Route path="/rooms/:roomId" element={<RoomDetail />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/history" element={<History />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/feed" element={<Feed />} />
          </Route>
          
          {/* Admin Routes - Join page is public */}
          <Route path="/admin/join" element={<AdminJoin />} />
          
          {/* Protected Admin Dashboard */}
          <Route element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/rooms" element={<AdminRooms />} />
            <Route path="/admin/rooms/:roomId" element={<AdminRoomDetail />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/analytics/user/:userId" element={<AdminUserAnalytics />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>
          
          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
