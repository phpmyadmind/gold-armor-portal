import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'

const AdminStations = () => {
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    problema: '',
    descripcion: '',
    videoUrl: '',
    headerText: 'ARMADURAS DE ORO'
  })

  useEffect(() => {
    fetchStations()
  }, [])

  const fetchStations = async () => {
    try {
      const response = await api.get('/stations')
      setStations(response.data)
    } catch (error) {
      console.error('Error al cargar estaciones:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        // Editar
        await api.put(`/stations/${editingId}`, formData)
      } else {
        // Crear
        await api.post('/stations', formData)
      }
      fetchStations()
      resetForm()
    } catch (error) {
      console.error('Error al guardar estación:', error)
      alert('Error al guardar la estación')
    }
  }

  const handleEdit = (station) => {
    setFormData(station)
    setEditingId(station.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta estación?')) return
    try {
      await api.delete(`/stations/${id}`)
      fetchStations()
    } catch (error) {
      console.error('Error al eliminar estación:', error)
      alert('Error al eliminar la estación')
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      problema: '',
      descripcion: '',
      videoUrl: '',
      headerText: 'ARMADURAS DE ORO'
    })
    setEditingId(null)
    setShowForm(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Cargando estaciones...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-white text-4xl font-bold">Gestión de Estaciones</h1>
          <div className="flex gap-4">
            <Link
              to="/admin"
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
            >
              ← Volver
            </Link>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-gold-orange text-white px-6 py-2 rounded-lg hover:bg-opacity-90"
            >
              {showForm ? 'Cancelar' : '+ Nueva Estación'}
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white bg-opacity-10 rounded-lg p-6 mb-8">
            <h2 className="text-white text-2xl font-bold mb-4">
              {editingId ? 'Editar Estación' : 'Nueva Estación'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white mb-2">Nombre *</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Problema *</label>
                <input
                  type="text"
                  required
                  value={formData.problema}
                  onChange={(e) => setFormData({ ...formData, problema: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-white mb-2">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg"
                  rows="3"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-white mb-2">URL del Video</label>
                <input
                  type="text"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg"
                  placeholder="ej: /uploads/video.mp4"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-white mb-2">Texto del Encabezado</label>
                <input
                  type="text"
                  value={formData.headerText}
                  onChange={(e) => setFormData({ ...formData, headerText: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg"
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-6 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            >
              {editingId ? 'Actualizar' : 'Crear'} Estación
            </button>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-700">
                <th className="text-white px-4 py-2 text-left">ID</th>
                <th className="text-white px-4 py-2 text-left">Nombre</th>
                <th className="text-white px-4 py-2 text-left">Problema</th>
                <th className="text-white px-4 py-2 text-left">Video</th>
                <th className="text-white px-4 py-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {stations.map((station) => (
                <tr key={station.id} className="bg-gray-800 border-b border-gray-700">
                  <td className="text-white px-4 py-2">{station.id}</td>
                  <td className="text-white px-4 py-2">{station.nombre}</td>
                  <td className="text-white px-4 py-2 truncate max-w-xs">{station.problema}</td>
                  <td className="text-white px-4 py-2">{station.videoUrl ? '✓' : '-'}</td>
                  <td className="text-white px-4 py-2 text-center">
                    <button
                      onClick={() => handleEdit(station)}
                      className="bg-blue-500 px-3 py-1 rounded-md hover:bg-blue-600 mr-2"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(station.id)}
                      className="bg-red-500 px-3 py-1 rounded-md hover:bg-red-600"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminStations
