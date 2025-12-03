import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import api from '../services/api';

// 1. CREACIÓN DEL CONTEXTO
const AuthContext = createContext(null);

// 2. HOOK PERSONALIZADO para consumir el contexto de forma segura
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

// 3. PROVEEDOR DEL CONTEXTO
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Inicia en true para verificar la sesión

  // Efecto para verificar si hay una sesión activa al cargar la app
  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem('token');
      const userDataString = localStorage.getItem('userData');

      if (token && userDataString) {
        try {
          const userData = JSON.parse(userDataString);
          setUser(userData);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } catch (error) {
          console.error("Error al parsear datos de usuario:", error);
          localStorage.removeItem('token');
          localStorage.removeItem('userData');
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

  // --- FUNCIONES DE AUTENTICACIÓN (MEMOIZADAS CON useCallback) ---

  const updateUserState = useCallback((token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userData', JSON.stringify(userData));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  }, []);

  // Login para usuarios con roles (admin, director, etc.)
  const login = useCallback(async (email, password) => {
    try {
      const response = await api.post('/auth/admin/login', { email, password });
      // FIX: La respuesta ya es el objeto de datos gracias al interceptor
      const { token, user: userData } = response;
      updateUserState(token, userData);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al iniciar sesión. Verifique sus credenciales.';
      return { success: false, message };
    }
  }, [updateUserState]);

  // Registro y login para participantes del evento
  const registerUser = useCallback(async (userDataPayload) => {
    const response = await api.post('/auth/register', userDataPayload);
    // FIX: La respuesta ya es el objeto de datos gracias al interceptor
    const { token, user: userData } = response;
    updateUserState(token, userData);
    return userData;
  }, [updateUserState]);

  // Cierre de sesión
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  }, []);

  // --- VALOR DEL CONTEXTO (MEMOIZADO CON useMemo) ---
  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.rol === 'admin',
    login,
    registerUser,
    logout,
  }), [user, loading, login, registerUser, logout]);

  // Renderizar el proveedor con el valor memoizado
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
