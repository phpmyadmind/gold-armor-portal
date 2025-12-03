import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.DEV ? 'http://localhost:5040/api' : 'https://armadurasdeoro.com/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para agregar token en cada petición
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para estandarizar respuestas y manejar errores
api.interceptors.response.use(
  // 1. Para respuestas exitosas (2xx), devuelve directamente los datos.
  (response) => response.data,
  
  // 2. Para errores, maneja el caso de 401 y rechaza la promesa.
  (error) => {
    // Si el token es inválido o ha expirado, desloguea al usuario.
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('userData')
      // Redirige a la página de inicio. El flujo de la app se encargará
      // de mostrar la página de login si es necesario.
      window.location.href = '/'
    }
    
    // Rechazar la promesa para que el bloque .catch() del componente se active.
    return Promise.reject(error)
  }
)

export default api
