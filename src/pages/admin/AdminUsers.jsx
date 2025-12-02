import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    identificacion: '',
    email: '',
    password: '',
    rol: 'usuario',
    ciudad: ''
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users')
      setUsers(response.data)
    } catch (error) {
      console.error('Error al cargar usuarios:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        // Editar usuario
        await api.put(`/users/${editingId}`, formData)
      } else {
        // Crear usuario
        await api.post('/users', formData)
      }
      fetchUsers()
      resetForm()
    } catch (error) {
      console.error('Error al guardar usuario:', error)
      alert('Error al guardar el usuario')
    }
  }

  const handleEdit = (user) => {
    setFormData({
      nombre: user.nombre,
      identificacion: user.identificacion,
      email: user.email,
      password: '', // No pre-rellenar password por seguridad
      rol: user.rol,
      ciudad: user.ciudad || ''
    })
    setEditingId(user.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return
    try {
      await api.delete(`/users/${id}`)
      fetchUsers()
    } catch (error) {
      console.error('Error al eliminar usuario:', error)
      alert('Error al eliminar el usuario')
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      identificacion: '',
      email: '',
      password: '',
      rol: 'usuario',
      ciudad: ''
    })
    setEditingId(null)
    setShowForm(false)
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-white text-4xl font-bold">Gestión de Usuarios</h1>
          <div className="flex gap-4">
            <Link
              to="/admin/register"
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-opacity-90"
            >
              + Registrar Admin/Speaker
            </Link>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-gold-orange text-white px-6 py-2 rounded-lg hover:bg-opacity-90"
            >
              {showForm ? 'Cancelar' : '+ Nuevo Usuario'}
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white bg-opacity-10 rounded-lg p-6 mb-8">
            <h2 className="text-white text-2xl font-bold mb-4">
              {editingId ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white mb-2">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Identificación *</label>
                <input
                  type="text"
                  required
                  value={formData.identificacion}
                  onChange={(e) => setFormData({ ...formData, identificacion: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-white mb-2">
                  Contraseña {editingId ? '(dejar en blanco para no cambiar)' : '*'}
                </label>
                <input
                  type="password"
                  required={!editingId}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Rol *</label>
                <select
                  required
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg"
                >
                  <option value="usuario">Usuario</option>
                  <option value="admin">Administrador</option>
                  <option value="speaker">Speaker</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              <div>
                <label className="block text-white mb-2">Ciudad</label>
                <input
                  type="text"
                  value={formData.ciudad}
                  onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-4">
              <button
                type="submit"
                className="bg-gold-orange text-white px-6 py-2 rounded-lg hover:bg-opacity-90"
              >
                {editingId ? 'Actualizar' : 'Crear'} Usuario
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-opacity-90"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {loading ? (
            <div className="text-white">Cargando...</div>
          ) : users.length === 0 ? (
            <div className="text-white">No hay usuarios registrados</div>
          ) : (
            <div className="bg-white bg-opacity-10 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-castle-blue-light">
                  <tr>
                    <th className="text-left p-4 text-white">Nombre</th>
                    <th className="text-left p-4 text-white">Identificación</th>
                    <th className="text-left p-4 text-white">Email</th>
                    <th className="text-left p-4 text-white">Rol</th>
                    <th className="text-left p-4 text-white">Ciudad</th>
                    <th className="text-left p-4 text-white">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t border-white border-opacity-10">
                      <td className="p-4 text-white">{user.nombre}</td>
                      <td className="p-4 text-white">{user.identificacion}</td>
                      <td className="p-4 text-white">{user.email}</td>
                      <td className="p-4">
                        <span className="bg-gold-orange text-white px-2 py-1 rounded text-sm">
                          {user.rol}
                        </span>
                      </td>
                      <td className="p-4 text-white">{user.ciudad || '-'}</td>
                      <td className="p-4 flex gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-opacity-90"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminUsers


