import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const Register = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [eventoActivo, setEventoActivo] = useState(null)
  const { register, login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Obtener evento activo
    const fetchEventoActivo = async () => {
      try {
        const response = await api.get('/events/active')
        if (response.data) {
          setEventoActivo(response.data)
        }
      } catch (error) {
        console.error('Error al obtener evento activo:', error)
      }
    }
    fetchEventoActivo()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.nombre.trim()) {
      setError('El nombre es requerido')
      return
    }

    if (!formData.email.trim()) {
      setError('El correo corporativo es requerido')
      return
    }

    // Validar que sea correo corporativo (opcional pero recomendado)
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(formData.email)) {
      setError('Por favor ingrese un correo corporativo válido')
      return
    }

    setLoading(true)

    try {
      // 1. Primero verificar si el usuario existe
      const verifyResponse = await api.post('/auth/verify-user', {
        email: formData.email
      })

      if (verifyResponse.data.exists) {
        // Usuario existe - iniciar sesión automáticamente
        const loginResult = await login(formData.email, null)
        
        if (loginResult.success) {
          // Sesión iniciada exitosamente - redirigir a /stations
          navigate('/stations')
        } else {
          setError(loginResult.message || 'Error al iniciar sesión')
        }
        setLoading(false)
        return
      }
    } catch (error) {
      // Usuario no existe (error 404 esperado)
      if (error.response?.status !== 404) {
        setError(error.response?.data?.message || 'Error al verificar usuario')
        setLoading(false)
        return
      }
    }

    // 2. Usuario no existe - crear nuevo usuario automáticamente
    const identificacion = formData.email.split('@')[0] || Date.now().toString()
    
    const registerData = {
      identificacion: identificacion,
      nombre: formData.nombre,
      email: formData.email,
      ciudad: '',
      eventoId: eventoActivo?.id || null
      // El backend siempre asignará rol 'usuario' para registro público
    }

    const result = await register(registerData)

    if (result.success) {
      // Usuario creado exitosamente - redirigir a /stations
      navigate('/stations')
    } else {
      // Error al crear usuario
      setError(result.message || 'Error al crear el usuario. Por favor intente nuevamente.')
    }
    setLoading(false)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full text-center mb-8">
        {/* Logo */}
        <div className="mb-8">
          <img 
            src="/LOGO_ARMADURAS.png" 
            alt="ARMADURAS DE ORO" 
            className="h-24 md:h-32 mx-auto object-contain drop-shadow-2xl"
          />
        </div>

        {/* Título REGISTRO */}
        <h1 className="text-white text-4xl md:text-5xl font-bold mb-12 drop-shadow-lg">
          REGISTRO
        </h1>

        {error && (
          <div className="bg-red-500 bg-opacity-80 border border-red-400 text-white px-4 py-3 rounded mb-6 max-w-md mx-auto">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-8">
          <div className="text-left">
            <label className="block text-white text-xl md:text-2xl font-bold mb-4 drop-shadow-lg">
              NOMBRE:
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              className="w-full px-6 py-4 text-lg bg-white bg-opacity-90 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-orange drop-shadow-lg"
              placeholder="Ingrese su nombre completo"
            />
          </div>

          <div className="text-left">
            <label className="block text-white text-xl md:text-2xl font-bold mb-4 drop-shadow-lg">
              CORREO CORPORATIVO:
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-6 py-4 text-lg bg-white bg-opacity-90 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-orange drop-shadow-lg"
              placeholder="correo@astrazeneca.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold-orange text-white text-xl md:text-2xl font-bold py-4 px-8 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 shadow-lg transform hover:scale-105"
          >
            {loading ? 'Validando...' : 'CONTINUAR'}
          </button>
        </form>

      </div>
      <div className="max-w-5xl mx-auto relative">
        {/* Logos y QR */}
        <div className="flex items-center justify-center flex-wrap gap-4 mb-4">
          <div className="flex items-center space-x-6">
            <div className="text-white text-sm drop-shadow-lg">
              <div className="flex justify-center items-center space-x-4">
                <img
                  src="/Logos_Astra_SCP.png"
                  alt="AZ y SCP"
                  className="h-20 md:h-24 object-contain"
                />
              </div>
            </div>
          </div>
          {/* Botón QR */}
          
        </div>
        {/* Disclaimer */}
        <p className="text-white text-xs text-center mb-4 drop-shadow-lg">
          Material dirigido y para uso exclusivo de empleados de AZ. Información confidencial. No distribuir
        </p>
      </div>
    </div>
  )
}

export default Register

