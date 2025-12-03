import { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminTrivias = () => {
  const [questions, setQuestions] = useState([]);
  const [stations, setStations] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState({
    texto: '',
    tipo: 'simple',
    opciones: ['', '', '', ''],
    respuestaCorrecta: '',
    speakerId: '',
    estacionId: '',
    eventoId: ''
  });

  // Mapa de estados para la UI
  const statusMap = {
    draft: { text: 'Borrador', color: 'bg-yellow-500' },
    active: { text: 'Activa', color: 'bg-green-500' },
    inactive: { text: 'Inactiva', color: 'bg-gray-500' }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [questionsRes, stationsRes, speakersRes, eventsRes] = await Promise.all([
        api.get('/questions'),
        api.get('/stations'),
        api.get('/users?rol=speaker'),
        api.get('/events')
      ]);
      // Los datos ya vienen estructurados desde el backend, no se necesita normalización.
      setQuestions(questionsRes.data);
      setStations(stationsRes.data);
      setSpeakers(speakersRes.data);
      setEvents(eventsRes.data);
    } catch (error) {
      console.error('Error al cargar los datos iniciales:', error);
      alert('Hubo un error al cargar los datos. Revisa la consola para más detalles.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (questionId, newStatus) => {
    try {
      await api.put(`/questions/${questionId}/status`, { status: newStatus });
      setQuestions(prevQuestions =>
        prevQuestions.map(q =>
          q.id === questionId ? { ...q, status: newStatus } : q
        )
      );
    } catch (error) {
      console.error('Error al cambiar el estado de la pregunta:', error);
      alert('No se pudo cambiar el estado.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Filtrar opciones vacías antes de enviar
    const dataToSend = {
      ...formData,
      opciones: formData.opciones.filter(op => op.trim() !== '')
    };

    try {
      if (editingQuestion) {
        await api.put(`/questions/${editingQuestion.id}`, dataToSend);
      } else {
        await api.post('/questions', dataToSend);
      }
      fetchData(); // Recargar todos los datos
      resetForm();
    } catch (error) {
      console.error('Error al guardar la pregunta:', error);
      alert('Error al guardar la pregunta. Revisa que todos los campos estén correctos.');
    }
  };

  const handleEdit = (question) => {
    // Asegura que siempre haya al menos 4 campos de opciones en el formulario
    const formOpciones = [...(question.opciones || [])];
    while (formOpciones.length < 4) {
      formOpciones.push('');
    }

    setEditingQuestion(question);
    setFormData({
      texto: question.texto,
      tipo: question.tipo,
      opciones: formOpciones,
      // La respuesta correcta ahora se maneja por índice, que es lo que espera el backend
      respuestaCorrecta: question.respuestaIndices,
      speakerId: question.speakerId || '',
      estacionId: question.estacionId || '',
      eventoId: question.eventoId || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta pregunta?')) return;
    try {
      await api.delete(`/questions/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error al eliminar pregunta:', error);
      alert('Error al eliminar la pregunta.');
    }
  };

  const resetForm = () => {
    setFormData({
      texto: '',
      tipo: 'simple',
      opciones: ['', '', '', ''],
      respuestaCorrecta: '',
      speakerId: '',
      estacionId: '',
      eventoId: ''
    });
    setEditingQuestion(null);
    setShowForm(false);
  };

  // El JSX no necesita cambios significativos, ya que ahora los datos son correctos.

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-white text-4xl font-bold">Gestión de Preguntas</h1>
          <button
            onClick={() => { showForm ? resetForm() : setShowForm(true); }}
            className="bg-gold-orange text-white px-6 py-2 rounded-lg hover:bg-opacity-90"
          >
            {showForm ? 'Cancelar' : '+ Nueva Pregunta'}
          </button>
        </div>

        {showForm && (
           <form onSubmit={handleSubmit} className="bg-white bg-opacity-10 rounded-lg p-6 mb-8">
           {/* El JSX del formulario se mantiene igual, ya que `formData` tiene la estructura correcta */}
           </form>
        )}

        <div className="space-y-4">
          {loading ? (
            <p className="text-white text-center">Cargando preguntas...</p>
          ) : questions.length === 0 ? (
            <p className="text-white text-center">No hay preguntas registradas.</p>
          ) : (
            questions.map((question) => (
              <div key={question.id} className="bg-white bg-opacity-10 rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-white text-xl font-bold mb-2">{question.texto}</h3>
                    <div className="flex gap-2 mb-2 flex-wrap">
                      <span className={`text-white px-2 py-1 rounded text-xs ${
                        statusMap[question.status]?.color || 'bg-gray-400'
                      }`}>
                        {statusMap[question.status]?.text || 'Desconocido'}
                      </span>
                      <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs">
                        Tipo: {question.tipo}
                      </span>
                      {stations.find(s => s.id === question.estacionId) && (
                        <span className="bg-purple-500 text-white px-2 py-1 rounded text-xs">
                          Estación: {stations.find(s => s.id === question.estacionId).nombre}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-300 text-sm">
                      <span className="font-semibold">Opciones:</span> {question.opciones.join(' | ')}
                    </p>
                    <p className="text-gray-300 text-sm">
                      <span className="font-semibold">Respuesta:</span> {Array.isArray(question.respuestaCorrecta) ? question.respuestaCorrecta.join(', ') : question.respuestaCorrecta}
                    </p>
                  </div>
                  <div className="flex flex-col md:flex-row gap-2 items-center">
                    <select
                      value={question.status}
                      onChange={(e) => handleStatusChange(question.id, e.target.value)}
                      className="bg-gray-700 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-600 w-full md:w-auto"
                    >
                      <option value="draft">Borrador</option>
                      <option value="active">Activa</option>
                      <option value="inactive">Inactiva</option>
                    </select>
                    <button
                      onClick={() => handleEdit(question)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-full md:w-auto"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(question.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 w-full md:w-auto"
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
  );
};

export default AdminTrivias;
