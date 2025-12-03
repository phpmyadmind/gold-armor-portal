import { useState, useEffect } from 'react';
import api from '../../services/api';

const SpeakerDashboard = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      setError(null);
      try {
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (userData && userData.id) {
          const response = await api.get(`/questions/speaker/${userData.id}`);
          
          // **VALIDACIÓN CRÍTICA**
          // Asegurarse de que la respuesta es un array antes de actualizar el estado.
          if (Array.isArray(response.data)) {
            setQuestions(response.data);
          } else {
            // Si la API devuelve algo inesperado, tratarlo como si no hubiera preguntas.
            console.warn('La API no devolvió un array para las preguntas del speaker, se usará un array vacío.', response.data);
            setQuestions([]);
          }
        } else {
          // Si no hay datos de usuario, no hay preguntas que buscar.
          setQuestions([]);
        }
      } catch (err) {
        console.error('Error al cargar las preguntas del speaker:', err);
        setError('No se pudieron cargar las preguntas. Por favor, revisa tu conexión o contacta a soporte.');
        setQuestions([]); // Limpiar cualquier dato previo en caso de error
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  return (
    <div className="min-h-screen px-4 py-12 bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gold-orange">Panel de Speaker</h1>
        
        <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-6">Mis Preguntas Asignadas</h2>
          
          {loading && <p className="text-center text-gray-400">Cargando preguntas...</p>}

          {!loading && error && (
            <div className="text-center bg-red-800/50 p-4 rounded-lg">
              <p className="font-bold">Ha ocurrido un error</p>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && questions.length === 0 && (
            <p className="text-center text-gray-500 py-8">No tienes preguntas asignadas en este momento.</p>
          )}

          {!loading && !error && questions.length > 0 && (
            <div className="space-y-4">
              {questions.map((question) => (
                <div key={question.id} className="bg-white/10 rounded-lg p-4 transition-transform hover:scale-105">
                  <h3 className="font-bold text-lg mb-2 text-sky-blue">{question.texto}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 items-center text-sm">
                    <span className="font-semibold text-gray-300">Tipo: <span className="font-normal text-white">{question.tipo}</span></span>
                    <span className="font-semibold text-gray-300">Estación: <span className="font-normal text-white">{question.estacionId}</span></span>
                     <span className={`px-3 py-1 text-xs font-bold rounded-full ${question.status === 'active' ? 'bg-green-500/80' : 'bg-yellow-500/80'} text-white`}>
                       {question.status}
                     </span>
                  </div>
                  {question.opciones && question.opciones.length > 0 && (
                    <p className="text-gray-400 text-xs mt-3">
                       <span className="font-semibold">Opciones:</span> {question.opciones.join(', ')}
                     </p>
                  )}
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
