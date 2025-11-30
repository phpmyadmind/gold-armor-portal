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
      <div className="max-w-7xl mx-auto flex items-center justify-between relative">
        <Link to="/" className="flex items-center space-x-3">
          <img 
            src="/LOGO_ARMADURAS.png" 
            alt="ARMADURAS DE ORO" 
            className="h-12 md:h-16 object-contain"
          />
        </Link>

        {user && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-white bg-black bg-opacity-50 px-4 py-2 rounded-lg hover:bg-opacity-70 flex items-center space-x-2 backdrop-blur-sm"
            >
              <span>{user.nombre || user.email}</span>
              <span className="text-xs bg-orange-500 px-2 py-1 rounded">{user.rol}</span>
              <span>▼</span>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl" style={{ zIndex: 30 }}>
                <div className="py-2">
                  {user.rol === 'admin' && (
                    <Link
                      to="/admin"
                      className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                      onClick={() => setShowMenu(false)}
                    >
                      Panel Admin
                    </Link>
                  )}
                  {(user.rol === 'speaker' || user.rol === 'staff') && (
                    <Link
                      to="/speaker"
                      className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                      onClick={() => setShowMenu(false)}
                    >
                      Panel Speaker
                    </Link>
                  )}
                  <Link
                    to="/director"
                    className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                    onClick={() => setShowMenu(false)}
                  >
                    Dashboard Director
                  </Link>
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

