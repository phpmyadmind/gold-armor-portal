import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useRef, useEffect, useCallback } from 'react';

// Hook para detectar clics fuera de un elemento
const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
};

// Componente de enlace del menú para reutilización
const MenuLink = ({ to, children, ...props }) => (
  <Link
    to={to}
    className="block w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 transition-colors"
    {...props}
  >
    {children}
  </Link>
);

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Cerrar menú al hacer clic fuera
  useClickOutside(menuRef, () => setShowMenu(false));

  const handleLogout = useCallback(() => {
    const userRol = user?.rol;
    logout();
    navigate(userRol === 'admin' ? '/admin/login' : '/');
  }, [user, logout, navigate]);

  const adminMenu = (
    <>
      <MenuLink to="/admin" onClick={() => setShowMenu(false)}>Dashboard</MenuLink>
      <MenuLink to="/admin/designer" onClick={() => setShowMenu(false)}>Diseñador de Eventos</MenuLink>
      <MenuLink to="/admin/events" onClick={() => setShowMenu(false)}>Gestionar Eventos</MenuLink>
      <MenuLink to="/admin/users" onClick={() => setShowMenu(false)}>Gestionar Usuarios</MenuLink>
      <MenuLink to="/admin/stations" onClick={() => setShowMenu(false)}>Gestionar Estaciones</MenuLink>
      <MenuLink to="/admin/trivias" onClick={() => setShowMenu(false)}>Gestionar Trivias</MenuLink>
    </>
  );

  return (
    <header className="py-4 px-6 fixed top-0 left-0 right-0 bg-transparent z-30">
      <div className="max-w-7xl mx-auto flex items-center justify-between relative">
        <Link to="/" className="text-white text-xl font-bold drop-shadow-md">
          EventApp
        </Link>

        {user && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(prev => !prev)}
              aria-label="Abrir menú"
              className="p-2 rounded-lg bg-black bg-opacity-40 text-white hover:bg-opacity-60 backdrop-blur-sm transition-all"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-3 w-60 bg-white rounded-xl shadow-2xl overflow-hidden animate-fade-in-down">
                <div className="py-2">
                  <div className="px-4 py-2 border-b mb-2">
                    <p className="text-sm text-gray-500">Sesión iniciada como</p>
                    <p className="font-semibold text-gray-800">{user.email}</p>
                  </div>

                  {user.rol === 'admin' && adminMenu}
                  {(user.rol === 'speaker' || user.rol === 'staff') && <MenuLink to="/speaker" onClick={() => setShowMenu(false)}>Panel Speaker</MenuLink>}
                  {(user.rol === 'director' || user.rol === 'staff') && <MenuLink to="/director" onClick={() => setShowMenu(false)}>Dashboard Calificaciones</MenuLink>}

                  <div className="border-t mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
