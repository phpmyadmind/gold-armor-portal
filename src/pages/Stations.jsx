import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const Stations = () => {
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const response = await api.get('/stations')
        setStations(response.data)
      } catch (error) {
        console.error('Error al cargar estaciones:', error)
        // Si no hay estaciones, crear las 4 por defecto
        setStations([
          { id: 1, nombre: 'Estación 1', orden: 1 },
          { id: 2, nombre: 'Estación 2', orden: 2 },
          { id: 3, nombre: 'Estación 3', orden: 3 },
          { id: 4, nombre: 'Estación 4', orden: 4 }
        ])
      } finally {
        setLoading(false)
      }
    }
    fetchStations()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Cargando estaciones...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Título */}
        <h1 className="text-gold-orange text-4xl md:text-5xl font-bold text-center mb-8">
          ARMADURAS DE ORO
        </h1>

        {/* Texto introductorio */}
        <p className="text-white text-lg md:text-xl text-center mb-12 max-w-3xl mx-auto">
          Pon a prueba tu valentía responde el quizz de cada estación y avanza en orden para demostrar que tú también puedes forjar esperanza y proteger vidas.
        </p>

        {/* Botones de estaciones con imágenes */}
        <div className="space-y-6 max-w-2xl mx-auto">
          {stations
            .sort((a, b) => a.orden - b.orden)
            .map((station) => {
              const stationImage = `/Estaciones-${station.id}.png`
              return (
                <button
                  key={station.id}
                  onClick={() => navigate(`/station/${station.id}`)}
                  className="w-full text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 hover:scale-105 shadow-lg flex items-center justify-center gap-20"
                  style={{
                    backgroundColor: '#e2ad42',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(226, 173, 66, 0.9)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#e2ad42'
                  }}
                >
                  <img 
                    src={stationImage}
                    alt={station.nombre}
                    className="h-16 md:h-20 w-auto object-contain flex-shrink-0"
                    style={{
                      filter: 'drop-shadow(0 0 10px rgba(0, 238, 255, 0.45)) drop-shadow(0 0 20px rgba(100, 213, 250, 0.62)) drop-shadow(0 0 30px rgba(100, 213, 250, 0.62))',
                      transition: 'filter 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.filter = 'drop-shadow(0 0 15px rgba(100, 213, 250, 0.62)) drop-shadow(0 0 30px rgba(100, 213, 250, 0.62)) drop-shadow(0 0 45px rgba(100, 213, 250, 0.62)) drop-shadow(0 0 60px #0066ff)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.filter = 'drop-shadow(0 0 10px rgba(100, 213, 250, 0.62)) drop-shadow(0 0 20px rgba(100, 213, 250, 0.62)) drop-shadow(0 0 30px rgba(100, 213, 250, 0.62))'
                    }}
                    onError={(e) => {
                      // Si falla la imagen, ocultarla
                      e.target.style.display = 'none'
                    }}
                  />
                  <span className="text-base md:text-lg leading-tight">ESTACIÓN {station.id}</span>
                </button>
              )
            })}
        </div>
      </div>
    </div>
  )
}

export default Stations

