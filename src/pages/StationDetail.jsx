import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import StationImage from '../components/StationImage'

const StationDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [station, setStation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasCompleted, setHasCompleted] = useState(false)

  useEffect(() => {
    const fetchStation = async () => {
      try {
        const response = await api.get(`/stations/${id}`)
        setStation(response.data)
        
        // Verificar si el usuario ya completó esta estación
        const userData = JSON.parse(localStorage.getItem('userData'))
        if (userData) {
          const completedResponse = await api.get(`/responses/station/${id}/completed`)
          setHasCompleted(completedResponse.data.completed)
        }
      } catch (error) {
        console.error('Error al cargar estación:', error)
        // Datos por defecto
        setStation({
          id: parseInt(id),
          nombre: `Estación ${id}`,
          problema: 'Para vencer al dragón, primero debemos conocerlo',
          videoUrl: null,
          descripcion: ''
        })
      } finally {
        setLoading(false)
      }
    }
    fetchStation()
  }, [id])

  const handleStartQuiz = () => {
    navigate(`/station/${id}/quiz`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Título */}
        <h1 className="text-gold-orange text-4xl md:text-5xl font-bold text-center mb-12">
          ARMADURAS DE ORO
        </h1>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Logo de Estación */}
          <div className="flex-shrink-0 flex justify-center md:justify-start">
            <StationImage stationId={id} />
          </div>

          {/* Contenido principal */}
          <div className="flex-1 space-y-8">
            {/* El Problema */}
            <div>
              <h2 className="text-white text-2xl font-bold mb-4">EL PROBLEMA</h2>
              <p className="text-white text-lg mb-6">
                {station?.problema || 'Para vencer al dragón, primero debemos conocerlo'}
              </p>
              {station?.videoUrl && (
                <button className="bg-gold-orange text-white px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors">
                  Ver video
                </button>
              )}
            </div>

            {/* Quiz */}
            <div>
              <h2 className="text-white text-3xl font-bold mb-4">QUIZ</h2>
              {hasCompleted ? (
                <div className="bg-green-500 bg-opacity-20 border border-green-500 rounded-lg p-4 mb-4">
                  <p className="text-white">✓ Ya has completado el quiz de esta estación</p>
                </div>
              ) : (
                <button
                  onClick={handleStartQuiz}
                  className="bg-gold-orange text-white px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
                >
                  Realizar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StationDetail

