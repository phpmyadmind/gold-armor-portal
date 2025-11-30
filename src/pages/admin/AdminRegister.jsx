import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

const AdminRegister = () => {
  const [formData, setFormData] = useState({
    identificacion: '',
    nombre: '',
    email: '',
    password: '',
    rol: 'admin',
    ciudad: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/auth/admin/register', formData)
      alert('Usuario registrado exitosamente')
      navigate('/admin/login')
    } catch (error) {
      setError(error.response?.data?.message || 'Error al registrar el administrador')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white bg-opacity-10 backdrop-blur-sm rounded-lg shadow-xl p-8">
        <h2 className="text-3xl font-bold text-white text-center mb-6">
          Registro de Administrador
        </h2>
        <p className="text-white text-center mb-6 text-sm">
          Crea cuentas de administrador, speaker, staff o usuario
        </p>

        {error && (
          <div className="bg-red-500 bg-opacity-80 border border-red-400 text-white px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white font-semibold mb-2">
              Identificación *
            </label>
            <input
              type="text"
              name="identificacion"
              value={formData.identificacion}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-90"
              placeholder="1234567890"
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">
              Nombre Completo *
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-90"
              placeholder="Nombre completo"
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">
              Correo Electrónico *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-90"
              placeholder="admin@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">
              Contraseña *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-90"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">
              Rol *
            </label>
            <select
              name="rol"
              value={formData.rol}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-90"
            >
              <option value="admin">Administrador</option>
              <option value="speaker">Speaker</option>
              <option value="staff">Staff</option>
              <option value="usuario">Usuario</option>
            </select>
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">
              Ciudad
            </label>
            <input
              type="text"
              name="ciudad"
              value={formData.ciudad}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-90"
              placeholder="Bogotá"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold-orange text-white py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Registrando...' : 'Registrar Administrador'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-white text-sm">
            ¿Ya tienes cuenta?{' '}
            <button
              onClick={() => navigate('/admin/login')}
              className="text-gold-orange font-semibold hover:underline"
            >
              Inicia sesión aquí
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default AdminRegister

