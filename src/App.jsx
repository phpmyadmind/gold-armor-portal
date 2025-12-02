import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useEventSettings } from './hooks/useEventSettings' // Importar hook
import Layout from './components/Layout'
import Home from './pages/Home'
import Register from './pages/Register'
import Stations from './pages/Stations'
import StationDetail from './pages/StationDetail'
import Quiz from './pages/Quiz'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminEvents from './pages/admin/AdminEvents'
import AdminUsers from './pages/admin/AdminUsers'
import AdminTrivias from './pages/admin/AdminTrivias'
import AdminRegister from './pages/admin/AdminRegister'
import AdminLogin from './pages/admin/AdminLogin'
import SpeakerDashboard from './pages/speaker/SpeakerDashboard'
import DirectorDashboard from './pages/director/DirectorDashboard'
import './App.css'

// Componente para aplicar la configuración del evento
const EventSettingsManager = ({ children }) => {
  const { settings } = useEventSettings()

  useEffect(() => {
    if (settings?.bodyBackground) {
      document.body.style.backgroundImage = `url(${settings.bodyBackground})`
    }
  }, [settings])

  return children
}

// Componente para rutas protegidas
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-white text-xl drop-shadow-lg">Cargando...</div>
    </div>
  }

  if (!user) {
    // Si es ruta de admin y no está autenticado, redirigir a login de admin
    if (allowedRoles.includes('admin')) {
      return <Navigate to="/admin/login" replace />
    }
    // Siempre redirigir a Home para iniciar el flujo desde allí
    return <Navigate to="/" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <EventSettingsManager>
          <Routes>
            <Route path="/register" element={<Register />} />
            
            <Route path="/" element={<Layout><Home /></Layout>} />
            
            <Route 
              path="/stations" 
              element={
                <ProtectedRoute>
                  <Layout><Stations /></Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/station/:id" 
              element={
                <ProtectedRoute>
                  <Layout><StationDetail /></Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/station/:id/quiz" 
              element={
                <ProtectedRoute>
                  <Quiz />
                </ProtectedRoute>
              } 
            />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/register" element={<AdminRegister />} />
            
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Layout><AdminDashboard /></Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/events" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Layout><AdminEvents /></Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Layout><AdminUsers /></Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/trivias" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Layout><AdminTrivias /></Layout>
                </ProtectedRoute>
              } 
            />

            {/* Speaker Routes */}
            <Route 
              path="/speaker" 
              element={
                <ProtectedRoute allowedRoles={['speaker', 'staff']}>
                  <Layout><SpeakerDashboard /></Layout>
                </ProtectedRoute>
              } 
            />

            {/* Director Routes */}
            <Route 
              path="/director" 
              element={
                <Layout><DirectorDashboard /></Layout>
              } 
            />
          </Routes>
        </EventSettingsManager>
      </Router>
    </AuthProvider>
  )
}

export default App
