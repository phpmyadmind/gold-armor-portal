import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const AdminLogin = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(email, password)

    if (result.success) {
      // Verificar que sea admin
      const userData = JSON.parse(localStorage.getItem('userData'))
      if (userData.rol === 'admin') {
        navigate('/admin')
      } else {
        setError('Esta página es solo para administradores')
        localStorage.removeItem('token')
        localStorage.removeItem('userData')
      }
    } else {
      setError(result.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white bg-opacity-10 backdrop-blur-sm rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <img 
            src="/LOGO_ARMADURAS.png" 
            alt="ARMADURAS DE ORO" 
            className="h-20 md:h-24 mx-auto object-contain mb-6"
          />
          <h2 className="text-white text-3xl font-bold mb-2">
            Acceso de Administrador
          </h2>
          <p className="text-white text-sm">
            Ingresa tus credenciales de administrador
          </p>
        </div>

        {error && (
          <div className="bg-red-500 bg-opacity-80 border border-red-400 text-white px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white font-semibold mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-90"
              placeholder="admin@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-90"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold-orange text-white py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-white text-sm">
            ¿Necesitas crear una cuenta de administrador?{' '}
            <button
              onClick={() => navigate('/admin/register')}
              className="text-gold-orange font-semibold hover:underline"
            >
              Regístrate aquí
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin

