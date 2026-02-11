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

// Dashboard layout and pages
import { DashboardLayout, AdminLayout } from './components/layout'
import Dashboard from './pages/Dashboard'
import Rooms from './pages/Rooms'
import RoomDetail from './pages/RoomDetail'
import AttendanceRoom from './pages/AttendanceRoom'
import History from './pages/History'
import Profile from './pages/Profile'
import Settings from './pages/Settings'

// Admin pages
import { 
  AdminJoin, 
  AdminDashboard, 
  AdminRooms, 
  AdminRoomDetail, 
  AdminSettings,
  AdminAnalytics,
  AdminUserAnalytics 
} from './pages/admin'
import Analytics from './pages/Analytics'
import Gallery from './pages/Gallery'

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
    </BrowserRouter>
  )
}

export default App
