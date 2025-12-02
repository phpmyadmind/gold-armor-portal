import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

export const useEventSettings = () => {
  const { user } = useAuth()
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      if (user?.eventoId) {
        try {
          const response = await api.get(`/settings/${user.eventoId}`)
          setSettings(response.data)
        } catch (error) {
          console.error('Error al cargar la configuración del evento:', error)
        }
      }
      setLoading(false)
    }

    fetchSettings()
  }, [user])

  return { settings, loading }
}
