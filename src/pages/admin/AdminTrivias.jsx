import { useState, useEffect } from 'react';
import api from '../../services/api';
import { normalizeQuestions, normalizeOpciones } from '../../utils/questionHelpers';

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
    eventoId: '',
    estado: 'activa', // Añadir estado al formulario
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [questionsRes, stationsRes, speakersRes, eventsRes] = await Promise.all([
        api.get('/questions'),
        api.get('/stations'),
        api.get('/users?rol=speaker'),
        api.get('/events'),
      ]);
      setQuestions(normalizeQuestions(questionsRes.data));
      setStations(stationsRes.data);
      setSpeakers(speakersRes.data);
      setEvents(eventsRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (questionId, newStatus) => {
    try {
      await api.patch(`/questions/${questionId}/estado`, { estado: newStatus });
      setQuestions(prevQuestions =>
        prevQuestions.map(q => (q.id === questionId ? { ...q, estado: newStatus } : q))
      );
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('No se pudo cambiar el estado de la pregunta.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData };
      if (editingQuestion) {
        await api.put(`/questions/${editingQuestion.id}`, data);
      } else {
        await api.post('/questions', data);
      }
      fetchData();
      resetForm();
    } catch (error) {
      console.error('Error al guardar pregunta:', error);
      alert('Error al guardar la pregunta');
    }
  };

  const handleEdit = (question) => {
    let opciones = normalizeOpciones(question.opciones);
    while (opciones.length < 4) opciones.push('');

    let respuestaForForm = '';
    if (question.tipo === 'multiple') {
      const raw = Array.isArray(question.respuestaCorrecta) ? question.respuestaCorrecta : (question.respuestaCorrecta ? [question.respuestaCorrecta] : []);
      respuestaForForm = raw.map(r => opciones.indexOf(r)).filter(i => i >= 0);
    } else {
      const raw = typeof question.respuestaCorrecta === 'string' ? question.respuestaCorrecta : '';
      const idx = opciones.indexOf(raw);
      respuestaForForm = idx >= 0 ? idx.toString() : '';
    }

    setEditingQuestion(question);
    setFormData({
      texto: question.texto,
      tipo: question.tipo,
      opciones,
      respuestaCorrecta: respuestaForForm,
      speakerId: question.speakerId || '',
      estacionId: question.estacionId || '',
      eventoId: question.eventoId || '',
      estado: question.estado || 'activa',
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
      alert('Error al eliminar la pregunta');
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
      eventoId: '',
      estado: 'activa',
    });
    setEditingQuestion(null);
    setShowForm(false);
  };

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-white text-4xl font-bold">Gestión de Trivias</h1>
          <button onClick={() => setShowForm(!showForm)} className="bg-gold-orange text-white px-6 py-2 rounded-lg hover:bg-opacity-90">
            {showForm ? 'Cancelar' : '+ Nueva Pregunta'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white bg-opacity-10 rounded-lg p-6 mb-8">
            {/* ... form fields ... */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Columna 1: Campos principales */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-white mb-2">Texto de la Pregunta *</label>
                        <textarea required value={formData.texto} onChange={(e) => setFormData({ ...formData, texto: e.target.value })} className="w-full px-4 py-2 rounded-lg" rows="3" />
                    </div>
                    <div>
                        <label className="block text-white mb-2">Tipo de Pregunta *</label>
                        <select required value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value, respuestaCorrecta: '' })} className="w-full px-4 py-2 rounded-lg">
                            <option value="simple">Selección Simple</option>
                            <option value="multiple">Selección Múltiple</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-white mb-2">Estado</label>
                        <select value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value })} className="w-full px-4 py-2 rounded-lg">
                            <option value="activa">Activa</option>
                            <option value="inactiva">Inactiva</option>
                        </select>
                    </div>
                </div>

                {/* Columna 2: Asociaciones y Opciones */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-white mb-2">Evento *</label>
                        <select required value={formData.eventoId} onChange={(e) => setFormData({ ...formData, eventoId: e.target.value })} className="w-full px-4 py-2 rounded-lg">
                            <option value="">Seleccione un evento</option>
                            {events.map(event => <option key={event.id} value={event.id}>{event.nombre}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-white mb-2">Estación *</label>
                        <select required value={formData.estacionId} onChange={(e) => setFormData({ ...formData, estacionId: e.target.value })} className="w-full px-4 py-2 rounded-lg">
                            <option value="">Seleccione una estación</option>
                            {stations.map(station => <option key={station.id} value={station.id}>{station.nombre}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-white mb-2">Speaker</label>
                        <select value={formData.speakerId} onChange={(e) => setFormData({ ...formData, speakerId: e.target.value })} className="w-full px-4 py-2 rounded-lg">
                            <option value="">Sin speaker</option>
                            {speakers.map(speaker => <option key={speaker.id} value={speaker.id}>{speaker.nombre}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Opciones y Respuestas */}
            <div className="mt-6">
                <label className="block text-white mb-2">Opciones de Respuesta *</label>
                {formData.opciones.map((opcion, index) => (
                    <div key={index} className="mb-2 flex items-center gap-2">
                        <input type="text" value={opcion} onChange={(e) => { const newOpciones = [...formData.opciones]; newOpciones[index] = e.target.value; setFormData({ ...formData, opciones: newOpciones }); }} className="flex-1 px-4 py-2 rounded-lg" placeholder={`Opción ${String.fromCharCode(65 + index)}`} />
                        {formData.tipo === 'simple' && (
                            <input type="radio" name="respuestaCorrecta" checked={formData.respuestaCorrecta === index.toString()} onChange={() => setFormData({ ...formData, respuestaCorrecta: index.toString() })} className="w-6 h-6" />
                        )}
                    </div>
                ))}
                {formData.tipo === 'multiple' && (
                    <div className="mt-2">
                        <label className="block text-white mb-2">Respuestas Correctas (marque todas):</label>
                        {formData.opciones.filter(o => o.trim()).map((_, index) => (
                            <label key={index} className="flex items-center gap-2 text-white mb-2">
                                <input type="checkbox" checked={Array.isArray(formData.respuestaCorrecta) && formData.respuestaCorrecta.includes(index)} onChange={(e) => { const current = Array.isArray(formData.respuestaCorrecta) ? formData.respuestaCorrecta : []; const newRespuesta = e.target.checked ? [...current, index] : current.filter(i => i !== index); setFormData({ ...formData, respuestaCorrecta: newRespuesta }); }} className="w-4 h-4" />
                                Opción {String.fromCharCode(65 + index)}
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* Botones de acción */}
            <div className="flex gap-4 mt-6">
                <button type="submit" className="bg-gold-orange text-white px-6 py-2 rounded-lg hover:bg-opacity-90">{editingQuestion ? 'Actualizar' : 'Crear'}</button>
                <button type="button" onClick={resetForm} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-opacity-90">Cancelar</button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {loading ? (
            <div className="text-white">Cargando...</div>
          ) : questions.length === 0 ? (
            <div className="text-white">No hay preguntas registradas</div>
          ) : (
            questions.map((question) => (
              <div key={question.id} className={`bg-white bg-opacity-10 rounded-lg p-4 transition-opacity ${question.estado === 'inactiva' ? 'opacity-60' : ''}`}>
                <div className="flex flex-col md:flex-row justify-between md:items-center">
                  <div className="flex-1 mb-4 md:mb-0">
                    <h3 className="text-white text-xl font-bold mb-2">{question.texto}</h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-semibold">{question.tipo}</span>
                      <span className="bg-purple-500 text-white px-2 py-1 rounded text-xs font-semibold">Estación {question.estacionId}</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${question.estado === 'activa' ? 'bg-green-500' : 'bg-red-500'}`}>
                        {question.estado}
                      </span>
                    </div>
                    <p className="text-white text-sm text-opacity-70">Opciones: {question.opciones?.join(', ')}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <select value={question.estado} onChange={(e) => handleStatusChange(question.id, e.target.value)} className="bg-gray-700 text-white text-sm px-3 py-2 rounded-lg hover:bg-gray-600 focus:outline-none">
                      <option value="activa">Activa</option>
                      <option value="inactiva">Inactiva</option>
                    </select>
                    <button onClick={() => handleEdit(question)} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-opacity-90 text-sm">Editar</button>
                    <button onClick={() => handleDelete(question.id)} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-opacity-90 text-sm">Eliminar</button>
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
