import { useState, useEffect } from 'react'
import api from '../../services/api'

const AdminEvents = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: ''
  })

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const eventsData = await api.get('/events')
      setEvents(eventsData || [])
    } catch (error) {
      console.error('Error al cargar eventos:', error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingEvent) {
        await api.put(`/events/${editingEvent.id}`, formData)
      } else {
        await api.post('/events', formData)
      }
      fetchEvents()
      resetForm()
    } catch (error) {
      console.error('Error al guardar evento:', error)
      alert('Error al guardar el evento')
    }
  }

  const handleEdit = (event) => {
    setEditingEvent(event)
    setFormData({
      nombre: event.nombre,
      descripcion: event.descripcion || '',
      fechaInicio: event.fechaInicio ? event.fechaInicio.split('T')[0] : '',
      fechaFin: event.fechaFin ? event.fechaFin.split('T')[0] : ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este evento?')) return
    try {
      await api.delete(`/events/${id}`)
      fetchEvents()
    } catch (error) {
      console.error('Error al eliminar evento:', error)
      alert('Error al eliminar el evento')
    }
  }

  const handleToggleActive = async (event) => {
    try {
      await api.put(`/events/${event.id}/toggle-active`, { activo: !event.activo })
      fetchEvents()
    } catch (error) {
      console.error('Error al cambiar estado:', error)
      alert('Error al cambiar el estado del evento')
    }
  }

  const resetForm = () => {
    setFormData({ nombre: '', descripcion: '', fechaInicio: '', fechaFin: '' })
    setEditingEvent(null)
    setShowForm(false)
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-white text-4xl font-bold">Gestión de Eventos</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gold-orange text-white px-6 py-2 rounded-lg hover:bg-opacity-90"
          >
            {showForm ? 'Cancelar' : '+ Nuevo Evento'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white bg-opacity-10 rounded-lg p-6 mb-8">
            <h2 className="text-white text-2xl font-bold mb-4">
              {editingEvent ? 'Editar Evento' : 'Nuevo Evento'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white mb-2">Nombre del Evento *</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Fecha de Inicio</label>
                <input
                  type="date"
                  value={formData.fechaInicio}
                  onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
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
              <div>
                <label className="block text-white mb-2">Fecha de Fin</label>
                <input
                  type="date"
                  value={formData.fechaFin}
                  onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-4">
              <button
                type="submit"
                className="bg-gold-orange text-white px-6 py-2 rounded-lg hover:bg-opacity-90"
              >
                {editingEvent ? 'Actualizar' : 'Crear'}
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
          ) : events.length === 0 ? (
            <div className="text-white">No hay eventos registrados</div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="bg-white bg-opacity-10 rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-white text-2xl font-bold">{event.nombre}</h3>
                      {event.activo && (
                        <span className="bg-green-500 text-white px-3 py-1 rounded text-sm">
                          ACTIVO
                        </span>
                      )}
                    </div>
                    {event.descripcion && (
                      <p className="text-white text-opacity-80 mb-2">{event.descripcion}</p>
                    )}
                    <div className="text-white text-sm text-opacity-60">
                      {event.fechaInicio && `Inicio: ${new Date(event.fechaInicio).toLocaleDateString()}`}
                      {event.fechaFin && ` - Fin: ${new Date(event.fechaFin).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleActive(event)}
                      className={`px-4 py-2 rounded-lg text-white ${
                        event.activo ? 'bg-yellow-500' : 'bg-green-500'
                      } hover:bg-opacity-90`}
                    >
                      {event.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => handleEdit(event)}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminEvents
