import { useState, useEffect } from 'react'
import api from '../../services/api'
import { normalizeQuestions } from '../../utils/questionHelpers'

const SpeakerDashboard = () => {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData'))
      const response = await api.get(`/questions/speaker/${userData.id}`)
      // Normalizar las preguntas para asegurar que las opciones estén en formato correcto
      setQuestions(normalizeQuestions(response.data))
    } catch (error) {
      console.error('Error al cargar preguntas:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-white text-4xl font-bold mb-8">Panel de Speaker/Staff</h1>
        
        <div className="bg-white bg-opacity-10 rounded-lg p-6">
          <h2 className="text-white text-2xl font-bold mb-4">Preguntas Asociadas</h2>
          
          {loading ? (
            <div className="text-white">Cargando...</div>
          ) : questions.length === 0 ? (
            <div className="text-white">No tienes preguntas asignadas</div>
          ) : (
            <div className="space-y-4">
              {questions.map((question) => (
                <div key={question.id} className="bg-white bg-opacity-5 rounded-lg p-4">
                  <h3 className="text-white font-bold mb-2">{question.texto}</h3>
                  <div className="text-white text-sm text-opacity-80">
                    Estación: {question.estacionId} | Tipo: {question.tipo}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SpeakerDashboard

