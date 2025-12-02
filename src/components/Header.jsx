import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'

const Header = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)

  const handleLogout = () => {
    const userRol = user?.rol
    logout()
    // Redirigir según el rol
    if (userRol === 'admin') {
      navigate('/admin/login')
    } else {
      // Siempre redirigir a Home después de logout
      navigate('/')
    }
  }

  return (
    <header className="py-4 px-6 relative" style={{ zIndex: 20 }}>
      <div className="max-w-7xl mx-auto flex items-center justify-end relative">

        {user && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              aria-label="Abrir menú"
              className="text-white bg-black bg-opacity-50 p-2 rounded-lg hover:bg-opacity-70 backdrop-blur-sm"
            >
              {/* Icono de menú (hamburger) */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6h18M3 12h18M3 18h18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl" style={{ zIndex: 30 }}>
                <div className="py-2">
                  {/* Mostrar rol como cabecera */}
                  <div className="px-4 py-2 text-sm text-gray-500">{user.rol}</div>
                  {user.rol === 'admin' && (
                    <button
                      onClick={() => { window.open(`${window.location.origin}/admin`, '_blank'); setShowMenu(false); }}
                      className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                    >
                      Panel Admin
                    </button>
                  )}
                  {(user.rol === 'speaker' || user.rol === 'staff') && (
                    <button
                      onClick={() => { window.open(`${window.location.origin}/speaker`, '_blank'); setShowMenu(false); }}
                      className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                    >
                      Panel Speaker
                    </button>
                  )}
                  {(user.rol === 'director' || user.rol === 'staff') && (
                    <button
                      onClick={() => { window.open(`${window.location.origin}/director`, '_blank'); setShowMenu(false); }}
                      className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                    >
                      Dashboard de Calificaciones
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
