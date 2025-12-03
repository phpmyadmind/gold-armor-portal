import { useState, useEffect } from 'react';
import api from '../../services/api';

const SpeakerDashboard = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      if (userData && userData.id) {
        const response = await api.get(`/questions/speaker/${userData.id}`);
        // Los datos ya vienen pre-formateados desde el backend, no se necesita normalización.
        setQuestions(response.data);
      } else {
        // Manejar el caso donde no hay datos de usuario
        setQuestions([]);
      }
    } catch (error) {
      console.error('Error al cargar las preguntas del speaker:', error);
      // Opcional: mostrar un mensaje de error en la UI
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-white text-4xl font-bold mb-8">Panel de Speaker/Staff</h1>
        
        <div className="bg-white bg-opacity-10 rounded-lg p-6">
          <h2 className="text-white text-2xl font-bold mb-4">Mis Preguntas Asignadas</h2>
          
          {loading ? (
            <p className="text-white text-center">Cargando preguntas...</p>
          ) : questions.length === 0 ? (
            <p className="text-white text-center">No tienes preguntas asignadas en este momento.</p>
          ) : (
            <div className="space-y-4">
              {questions.map((question) => (
                <div key={question.id} className="bg-white bg-opacity-5 rounded-lg p-4">
                  <h3 className="text-white font-bold mb-2">{question.texto}</h3>
                  <p className="text-gray-300 text-sm">
                    <span className="font-semibold">Tipo:</span> {question.tipo} | <span className="font-semibold">Estación ID:</span> {question.estacionId}
                  </p>
                  {/* Mostramos las opciones si existen y el estado de la pregunta */}
                  <div className="flex items-center gap-4 mt-2">
                     <p className="text-gray-400 text-xs">
                       <span className="font-semibold">Opciones:</span> {question.opciones?.join(', ') || 'No especificadas'}
                     </p>
                     <span className={`px-2 py-1 text-xs rounded-full ${question.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'} text-white`}>
                       {question.status}
                     </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpeakerDashboard;
