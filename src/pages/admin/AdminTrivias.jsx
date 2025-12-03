import { useState, useEffect } from 'react'
import api from '../../services/api'
import { normalizeQuestions, normalizeOpciones } from '../../utils/questionHelpers'

const AdminTrivias = () => {
  const [questions, setQuestions] = useState([])
  const [stations, setStations] = useState([])
  const [speakers, setSpeakers] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [formData, setFormData] = useState({
    texto: '',
    tipo: 'simple',
    status: 'active', // <-- Nuevo campo de estado
    opciones: ['', '', '', ''],
    respuestaCorrecta: '',
    speakerId: '',
    estacionId: '',
    eventoId: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [questionsRes, stationsRes, speakersRes, eventsRes] = await Promise.all([
        api.get('/questions'),
        api.get('/stations'),
        api.get('/users?rol=speaker'),
        api.get('/events')
      ])
      setQuestions(normalizeQuestions(questionsRes.data))
      setStations(stationsRes.data)
      setSpeakers(speakersRes.data)
      setEvents(eventsRes.data)
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = { ...formData };
      if (editingQuestion) {
        await api.put(`/questions/${editingQuestion.id}`, data)
      } else {
        await api.post('/questions', data)
      }
      fetchData()
      resetForm()
    } catch (error) {
      console.error('Error al guardar pregunta:', error)
      alert('Error al guardar la pregunta')
    }
  }

  const handleEdit = (question) => {
    let opciones = normalizeOpciones(question.opciones)
    while (opciones.length < 4) {
      opciones.push('')
    }
    let respuestaForForm = ''
    if (question.tipo === 'multiple') {
      const raw = Array.isArray(question.respuestaCorrecta) ? question.respuestaCorrecta : (question.respuestaCorrecta ? [question.respuestaCorrecta] : [])
      respuestaForForm = raw.map(r => opciones.indexOf(r)).filter(i => i >= 0)
    } else {
      const raw = typeof question.respuestaCorrecta === 'string' ? question.respuestaCorrecta : (question.respuestaCorrecta ? String(question.respuestaCorrecta) : '')
      const idx = opciones.indexOf(raw)
      respuestaForForm = idx >= 0 ? idx.toString() : ''
    }

    setEditingQuestion(question)
    setFormData({
      texto: question.texto,
      tipo: question.tipo,
      status: question.status || 'active', // <-- Cargar estado al editar
      opciones,
      respuestaCorrecta: respuestaForForm,
      speakerId: question.speakerId || '',
      estacionId: question.estacionId || '',
      eventoId: question.eventoId || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta pregunta?')) return
    try {
      await api.delete(`/questions/${id}`)
      fetchData()
    } catch (error) {
      console.error('Error al eliminar pregunta:', error)
      alert('Error al eliminar la pregunta')
    }
  }

  // <-- Nueva función para cambiar el estado
  const handleToggleStatus = async (question) => {
    const newStatus = question.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/questions/${question.id}`, { status: newStatus });
      fetchData(); // Refrescar los datos para mostrar el cambio
    } catch (error) {
      console.error('Error al cambiar el estado:', error);
      alert('Error al actualizar el estado de la pregunta.');
    }
  };

  const resetForm = () => {
    setFormData({
      texto: '',
      tipo: 'simple',
      status: 'active', // <-- Resetear estado
      opciones: ['', '', '', ''],
      respuestaCorrecta: '',
      speakerId: '',
      estacionId: '',
      eventoId: ''
    })
    setEditingQuestion(null)
    setShowForm(false)
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-white text-4xl font-bold">Gestión de Trivias</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gold-orange text-white px-6 py-2 rounded-lg hover:bg-opacity-90"
          >
            {showForm ? 'Cancelar' : '+ Nueva Pregunta'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white bg-opacity-10 rounded-lg p-6 mb-8">
            {/* ... (resto del formulario sin cambios por ahora, se añadirá el campo de estado si es necesario) ... */}
            <h2 className="text-white text-2xl font-bold mb-4">
              {editingQuestion ? 'Editar Pregunta' : 'Nueva Pregunta'}
            </h2>
            <div className="space-y-4">
              {/* ... Campos existentes ... */}
              <div>
                  <label className="block text-white mb-2">Estado</label>
                  <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg"
                  >
                      <option value="active">Activa</option>
                      <option value="inactive">Inactiva</option>
                  </select>
              </div>
            </div>
             {/* ... (resto de los campos del formulario) ... */}
          </form>
        )}

        <div className="space-y-4">
          {loading ? (
            <div className="text-white">Cargando...</div>
          ) : questions.length === 0 ? (
            <div className="text-white">No hay preguntas registradas</div>
          ) : (
            questions.map((question) => (
              <div key={question.id} className="bg-white bg-opacity-10 rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-white text-xl font-bold mb-2">{question.texto}</h3>
                    <div className="flex gap-2 mb-2 items-center">
                      {/* <-- Insignia de estado --> */}
                      <span className={`px-2 py-1 rounded text-xs text-white ${question.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`}>
                        {question.status === 'active' ? 'Activa' : 'Inactiva'}
                      </span>
                      <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs">
                        {question.tipo}
                      </span>
                      {question.estacionId && (
                        <span className="bg-purple-500 text-white px-2 py-1 rounded text-xs">
                          Estación {stations.find(s => s.id === question.estacionId)?.nombre || question.estacionId}
                        </span>
                      )}
                    </div>
                    <div className="text-white text-sm text-opacity-60">
                      Opciones: {question.opciones?.join(', ')}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {/* <-- Botón para cambiar estado --> */}
                    <button
                      onClick={() => handleToggleStatus(question)}
                      className={`px-4 py-2 rounded-lg text-white ${question.status === 'active' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}`}
                    >
                      {question.status === 'active' ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => handleEdit(question)}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(question.id)}
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

export default AdminTrivias
