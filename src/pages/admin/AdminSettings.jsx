import { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../../contexts/AuthContext'
import api from '../../services/api'

const AdminSettings = () => {
  const { user } = useContext(AuthContext)
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const fetchSettings = async () => {
      if (user?.eventoId) {
        try {
          const response = await api.get(`/settings/${user.eventoId}`)
          setSettings(response.data)
        } catch (error) {
          console.error('Error al cargar la configuración:', error)
        }
      }
      setLoading(false)
    }

    fetchSettings()
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setSettings(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/settings/${user.eventoId}`, settings)
      setMessage('Configuración actualizada correctamente')
    } catch (error) {
      setMessage('Error al actualizar la configuración')
      console.error('Error al guardar la configuración:', error)
    }
  }

  if (loading) {
    return <div>Cargando...</div>
  }

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Configuración del Evento</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="bodyBackground" className="block text-sm font-medium">URL de Fondo del Body</label>
          <input
            type="text"
            name="bodyBackground"
            id="bodyBackground"
            value={settings.bodyBackground || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="buttonText" className="block text-sm font-medium">Texto de los Botones</label>
          <input
            type="text"
            name="buttonText"
            id="buttonText"
            value={settings.buttonText || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="resourcesLink" className="block text-sm font-medium">Enlace de Recursos</label>
          <input
            type="text"
            name="resourcesLink"
            id="resourcesLink"
            value={settings.resourcesLink || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md">Guardar Cambios</button>
      </form>
      {message && <p className="mt-4">{message}</p>}
    </div>
  )
}

export default AdminSettings
