
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useEventSettings } from './hooks/useEventSettings';
import Layout from './components/Layout';
import Home from './pages/Home';
import Register from './pages/Register';
import Stations from './pages/Stations';
import StationDetail from './pages/StationDetail';
import Quizz from './pages/Quiz';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEvents from './pages/admin/AdminEvents';
import AdminUsers from './pages/admin/AdminUsers';
import AdminStations from './pages/admin/AdminStations';
import AdminTrivias from './pages/admin/AdminTrivias';
import AdminRegister from './pages/admin/AdminRegister';
import AdminLogin from './pages/admin/AdminLogin';
import EventDesigner from './pages/admin/EventDesigner';
import SpeakerDashboard from './pages/speaker/SpeakerDashboard';
import DirectorDashboard from './pages/director/DirectorDashboard';
import './App.css';

// Componente para aplicar dinámicamente los estilos del evento activo
const EventSettingsManager = ({ children }) => {
  const { settings, loading } = useEventSettings();

  useEffect(() => {
    if (loading || !settings) return;

    const styleId = 'event-dynamic-styles';
    let styleElement = document.getElementById(styleId);
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    // Aplicar estilos al body
    document.body.style.backgroundColor = settings.bodyBgColor || '#000000';
    document.body.style.backgroundImage = settings.bodyBgImage ? `url(${settings.bodyBgImage})` : 'none';
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';

    // Crear y aplicar la hoja de estilos para fuentes y botones
    const css = `
      ${settings.fontFile ? `
        @font-face {
          font-family: 'EventCustomFont';
          src: url(${settings.fontFile});
        }
        body, button, input, h1, h2, h3, h4, h5, h6 {
          font-family: 'EventCustomFont', sans-serif;
        }
      ` : ''}

      :root {
        --btn-bg: ${settings.buttonBgColor || '#FF8C00'};
        --btn-text: ${settings.buttonTextColor || '#FFFFFF'};
        --btn-hover-bg: ${settings.buttonHoverBgColor || '#FFA500'};
        --btn-hover-text: ${settings.buttonHoverTextColor || '#FFFFFF'};
        --btn-border-radius: ${settings.buttonBorderRadius || '8px'};
      }
    `;
    styleElement.innerHTML = css;

    // Limpieza al desmontar
    return () => {
      document.body.style.cssText = '';
      if (styleElement) styleElement.innerHTML = '';
    };
  }, [settings, loading]);

  return children;
};

// Protege rutas según la autenticación y el rol del usuario
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen text-white text-xl">Cargando...</div>;
  if (!user) return <Navigate to={allowedRoles.includes('admin') ? '/admin/login' : '/'} replace />;
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.rol)) return <Navigate to="/" replace />;
  return children;
};

// Define una ruta de administrador para reducir la repetición
const AdminRoute = ({ element: Element }) => (
  <ProtectedRoute allowedRoles={['admin']}><Layout><Element /></Layout></ProtectedRoute>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <EventSettingsManager>
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/register" element={<AdminRegister />} />

            {/* Rutas Protegidas (Usuario General) */}
            <Route path="/stations" element={<ProtectedRoute><Layout><Stations /></Layout></ProtectedRoute>} />
            <Route path="/station/:id" element={<ProtectedRoute><Layout><StationDetail /></Layout></ProtectedRoute>} />
            <Route path="/station/:id/quizz" element={<ProtectedRoute><Quizz /></ProtectedRoute>} />
            <Route path="/station/:id/quiz" element={<ProtectedRoute><Quizz /></ProtectedRoute>} />

            {/* Rutas de Administración */}
            <Route path="/admin" element={<AdminRoute element={AdminDashboard} />} />
            <Route path="/admin/events" element={<AdminRoute element={AdminEvents} />} />
            <Route path="/admin/users" element={<AdminRoute element={AdminUsers} />} />
            <Route path="/admin/stations" element={<AdminRoute element={AdminStations} />} />
            <Route path="/admin/trivias" element={<AdminRoute element={AdminTrivias} />} />
            <Route path="/admin/designer" element={<AdminRoute element={EventDesigner} />} />

            {/* Rutas de Roles Específicos */}
            <Route path="/speaker" element={<ProtectedRoute allowedRoles={['speaker', 'staff']}><Layout><SpeakerDashboard /></Layout></ProtectedRoute>} />
            <Route path="/director" element={<ProtectedRoute allowedRoles={['director', 'staff']}><Layout><DirectorDashboard /></Layout></ProtectedRoute>} />
          </Routes>
        </EventSettingsManager>
      </Router>
    </AuthProvider>
  );
}

export default App;
