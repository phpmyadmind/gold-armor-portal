import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useEffect } from 'react'

const Home = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated && user) {
      // Si es admin, redirigir al panel de admin
      if (user.rol === 'admin') {
        navigate('/admin')
      } else {
        // Todos los demás usuarios con sesión abierta van a /stations
        navigate('/stations')
      }
    }
  }, [isAuthenticated, user, navigate])

  const handleStart = () => {
    if (isAuthenticated) {
      navigate('/stations')
    } else {
      navigate('/register')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative">
      {/* Logo principal */}
      <div className="text-center mb-12 relative" style={{ zIndex: 10 }}>
        <img 
          src="/LOGO_ARMADURAS.png" 
          alt="ARMADURAS DE ORO" 
          className="h-32 md:h-48 mx-auto object-contain drop-shadow-2xl"
        />
      </div>

      {/* Botón INICIAR */}
      <button
        onClick={handleStart}
        className="bg-none font-bold px-12 py-6 rounded-lg transform hover:scale-60 transition-transform duration-200 relative"
        style={{ zIndex: 10 }}
      >
        <img src="/Boton_Iniciar.png" alt="INICIAR" className="w-50 h-auto object-contain" />
      </button>
    </div>
  )
}

export default Home

