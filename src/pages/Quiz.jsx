import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import StationImage from '../components/StationImage'
import QRCodeModal from '../components/QRCodeModal'
import { normalizeQuestions } from '../utils/questionHelpers'

const Quiz = () => {
  const { id: stationId } = useParams()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [station, setStation] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [startTime, setStartTime] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar información de la estación
        try {
          const stationResponse = await api.get(`/stations/${stationId}`)
          setStation(stationResponse.data)
        } catch (error) {
          console.error('Error al cargar estación:', error)
          // Datos por defecto
          setStation({
            id: parseInt(stationId),
            nombre: `Estación ${stationId}`,
            problema: ''
          })
        }

        // Cargar preguntas de la estación (accesible para usuarios con rol "usuario")
        const response = await api.get(`/questions/station/${stationId}`)
        const questionsData = response.data
        
        if (!questionsData || questionsData.length === 0) {
          console.warn(`No se encontraron preguntas para la estación ${stationId}`)
          setQuestions([])
          return
        }
        
        // Normalizar las preguntas para asegurar que las opciones estén en formato correcto
        const normalizedQuestions = normalizeQuestions(questionsData)
        
        // Asegurar que las preguntas tengan opciones válidas
        const questionsWithValidOptions = normalizedQuestions.map((q, idx) => {
          // Si después de normalizar no hay opciones, intentar obtenerlas del dato original
          if (!q.opciones || !Array.isArray(q.opciones) || q.opciones.length === 0) {
            const original = questionsData[idx]
            if (original && original.opciones) {
              // Intentar parsear directamente
              let opciones = original.opciones
              if (typeof opciones === 'string') {
                try {
                  opciones = JSON.parse(opciones)
                } catch (e) {
                  console.error('Error parseando opciones:', e)
                }
              }
              if (Array.isArray(opciones) && opciones.length > 0) {
                q.opciones = opciones
              }
            }
          }
          
          // Verificar que las opciones sean válidas (filtrar null/undefined pero mantener strings)
          if (Array.isArray(q.opciones)) {
            q.opciones = q.opciones.filter(op => op != null && String(op).trim().length > 0)
          }
          
          return q
        }).filter(q => {
          // Solo incluir preguntas con opciones válidas
          const tieneOpciones = q && Array.isArray(q.opciones) && q.opciones.length > 0
          if (!tieneOpciones) {
            console.warn(`⚠️ Filtrando pregunta ${q?.id} sin opciones válidas en frontend`)
          }
          return tieneOpciones
        })
        
        console.log(`✅ Estación ${stationId}: ${questionsWithValidOptions.length} preguntas con opciones válidas cargadas`)
        questionsWithValidOptions.forEach((q, idx) => {
          console.log(`  ✓ Pregunta ${idx + 1} (ID: ${q.id}): "${q.texto?.substring(0, 50)}..." - ${q.opciones.length} opciones`)
        })
        
        setQuestions(questionsWithValidOptions)
        
        // Inicializar tiempos de inicio para cada pregunta
        const times = {}
        questionsData.forEach(q => {
          times[q.id] = Date.now()
        })
        setStartTime(times)
      } catch (error) {
        console.error('Error al cargar datos:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [stationId])

  const handleAnswerChange = (questionId, answer) => {
    const question = questions.find(q => q.id === questionId)
    
    if (question.tipo === 'multiple') {
      setSelectedAnswers(prev => {
        const current = prev[questionId] || []
        if (current.includes(answer)) {
          return { ...prev, [questionId]: current.filter(a => a !== answer) }
        } else {
          return { ...prev, [questionId]: [...current, answer] }
        }
      })
    } else {
      setSelectedAnswers(prev => ({ ...prev, [questionId]: answer }))
    }
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    const userData = JSON.parse(localStorage.getItem('userData'))
    
    try {
      const responses = questions.map(question => {
        const selected = selectedAnswers[question.id]
        const questionStartTime = startTime[question.id]
        const responseTime = questionStartTime ? Math.floor((Date.now() - questionStartTime) / 1000) : 0
        
        let isCorrect = false
        if (question.tipo === 'simple') {
          isCorrect = selected === question.respuestaCorrecta
        } else if (question.tipo === 'multiple') {
          const correctAnswers = Array.isArray(question.respuestaCorrecta) 
            ? question.respuestaCorrecta 
            : [question.respuestaCorrecta]
          const selectedArray = Array.isArray(selected) ? selected : []
          isCorrect = correctAnswers.length === selectedArray.length &&
            correctAnswers.every(a => selectedArray.includes(a))
        }
        
        return {
          userId: userData.id,
          eventoId: userData.eventoId,
          questionId: question.id,
          estacionId: parseInt(stationId),
          respuestaSeleccionada: selected,
          esCorrecta: isCorrect,
          tiempoRespuesta: responseTime,
          estado: 'completado'
        }
      })

      await api.post('/responses/batch', { responses })
      
      // Redirigir a la siguiente estación después de completar
      const nextStationId = parseInt(stationId) + 1
      navigate(`/station/${nextStationId}`)
    } catch (error) {
      console.error('Error al enviar respuestas:', error)
      alert('Error al enviar las respuestas. Por favor, intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Cargando preguntas...</div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">No hay preguntas disponibles para esta estación.</div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const selectedAnswer = selectedAnswers[currentQuestion?.id]
  
  // Verificar que la pregunta actual tenga opciones válidas
  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">
          Error: No se pudo cargar la pregunta actual.
        </div>
      </div>
    )
  }
  
  // Verificar opciones
  const tieneOpciones = Array.isArray(currentQuestion.opciones) && currentQuestion.opciones.length > 0
  if (!tieneOpciones) {
    console.error('Pregunta sin opciones:', {
      preguntaId: currentQuestion.id,
      texto: currentQuestion.texto,
      opciones: currentQuestion.opciones,
      tipo: typeof currentQuestion.opciones
    })
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header con logo y título de estación */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/station/${stationId}`)}
              className="text-white hover:text-gold-orange transition-colors text-lg"
              title="Volver a la estación"
            >
              ← Volver
            </button>
            <h1 className="text-white text-4xl font-bold">QUIZ</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowQRCode(true)}
              className="bg-sky-blue text-white px-4 py-2 rounded-lg hover:bg-opacity-80 transition-colors flex items-center gap-2"
              title="Generar código QR"
            >
              📱 QR
            </button>
            <StationImage 
              stationId={stationId} 
              className="max-w-[120px] h-auto object-contain drop-shadow-2xl" 
              size="small" 
            />
          </div>
        </div>

        {/* Información de la estación */}
        {station && (
          <div className="bg-white bg-opacity-10 rounded-lg p-4 mb-6">
            <h2 className="text-white text-xl font-semibold mb-2">
              Estación {stationId}: {station.nombre || `Estación ${stationId}`}
            </h2>
            {station.problema && (
              <p className="text-white text-sm opacity-80">{station.problema}</p>
            )}
          </div>
        )}

        {/* Pregunta */}
        <div className="bg-white bg-opacity-10 rounded-lg p-6 mb-6">
          <p className="text-white text-lg mb-6">
            {currentQuestion.texto || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'}
          </p>

          {/* Opciones de respuesta */}
          <div className="space-y-3 mt-4">
            {tieneOpciones ? (
              currentQuestion.opciones.map((opcion, index) => {
                const letter = String.fromCharCode(65 + index) // A, B, C, D
                const opcionTexto = String(opcion || '').trim()
                const isSelected = currentQuestion.tipo === 'multiple'
                  ? (selectedAnswer || []).includes(opcion)
                  : selectedAnswer === opcion

                if (!opcionTexto) {
                  return null // No renderizar opciones vacías
                }

                return (
                  <button
                    key={`opcion-${index}-${currentQuestion.id}`}
                    onClick={() => handleAnswerChange(currentQuestion.id, opcion)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-blue bg-opacity-30 border-sky-blue'
                        : 'bg-white bg-opacity-10 border-white border-opacity-30 hover:border-sky-blue hover:bg-opacity-20'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        isSelected ? 'bg-sky-blue text-white' : 'bg-castle-blue-light text-white'
                      }`}>
                        {letter}
                      </div>
                      <span className="text-white flex-1 text-base">
                        {opcionTexto}
                      </span>
                      {isSelected && (
                        <span className="text-sky-blue text-xl flex-shrink-0">✓</span>
                      )}
                    </div>
                  </button>
                )
              }).filter(Boolean) // Filtrar nulls
            ) : (
              <div className="text-white text-center py-4 bg-red-500 bg-opacity-20 rounded-lg border border-red-500">
                <p className="font-semibold mb-2">⚠️ No hay opciones disponibles para esta pregunta</p>
                <p className="text-sm opacity-80">
                  Estación: {stationId} | Pregunta ID: {currentQuestion?.id} | 
                  Tipo de opciones: {typeof currentQuestion?.opciones} | 
                  Es array: {Array.isArray(currentQuestion?.opciones) ? 'Sí' : 'No'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navegación */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="bg-castle-blue-light text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-80"
          >
            Anterior
          </button>
          
          <span className="text-white">
            Pregunta {currentQuestionIndex + 1} de {questions.length}
          </span>
          
          {currentQuestionIndex < questions.length - 1 ? (
            <button
              onClick={handleNext}
              className="bg-gold-orange text-white px-6 py-2 rounded-lg hover:bg-opacity-90"
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !selectedAnswer || (Array.isArray(selectedAnswer) && selectedAnswer.length === 0)}
              className="bg-gold-orange text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-90"
            >
              {submitting ? 'Enviando...' : 'ENVIAR RESPUESTA'}
            </button>
          )}
        </div>

        {/* Indicador de progreso */}
        <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
          <div
            className="bg-gold-orange h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Modal de QR */}
      {showQRCode && (
        <QRCodeModal 
          url={window.location.href} 
          onClose={() => setShowQRCode(false)} 
        />
      )}
    </div>
  )
}

export default Quiz

