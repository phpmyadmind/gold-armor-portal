import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import StationImage from '../components/StationImage';
import QRCodeModal from '../components/QRCodeModal';

// --- Componente de Esqueleto para la Carga ---
const QuizSkeleton = () => (
  <div className="max-w-4xl mx-auto animate-pulse">
    <div className="h-8 bg-gray-700 rounded w-1/4 mb-12"></div>
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <div className="h-6 bg-gray-700 rounded w-3/4 mb-8"></div>
      <div className="space-y-4">
        <div className="h-16 bg-gray-700 rounded-lg"></div>
        <div className="h-16 bg-gray-700 rounded-lg"></div>
        <div className="h-16 bg-gray-700 rounded-lg"></div>
      </div>
    </div>
    <div className="flex justify-between items-center">
      <div className="h-12 bg-gray-700 rounded w-32"></div>
      <div className="h-12 bg-gray-700 rounded w-32"></div>
    </div>
  </div>
);

// --- Componente Principal del Quiz ---
const Quiz = () => {
  const { id: stationId } = useParams();
  const navigate = useNavigate();

  // Estados de datos y UI
  const [station, setStation] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [totalStations, setTotalStations] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  
  // Estados de carga y error
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Estado para el modal de QR
  const [showQRCode, setShowQRCode] = useState(false);

  // Ref para medir el tiempo por pregunta de forma precisa
  const questionStartTime = useRef(null);

  // --- EFECTO PRINCIPAL PARA CARGAR DATOS ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Hacemos las llamadas a la API en paralelo para más eficiencia
        const [stationRes, questionsRes, allStationsRes] = await Promise.all([
          api.get(`/stations/${stationId}`),
          api.get(`/questions/station/${stationId}`),
          api.get('/stations') // Necesario para saber cuál es la última estación
        ]);

        // Validamos que las preguntas tengan opciones desde el backend
        const validQuestions = questionsRes.data.filter(
          q => Array.isArray(q.opciones) && q.opciones.length > 0
        );

        setStation(stationRes.data);
        setQuestions(validQuestions);
        setTotalStations(allStationsRes.data.length);

      } catch (err) {
        console.error('Error fatal al cargar datos del quiz:', err);
        setError('No se pudieron cargar los datos para esta estación. Es posible que el servidor no esté disponible o la estación no exista.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [stationId]);

  // --- EFECTO PARA MEDIR EL TIEMPO ---
  // Se activa cada vez que se muestra una nueva pregunta
  useEffect(() => {
    questionStartTime.current = Date.now();
  }, [currentQuestionIndex]);


  // --- MANEJADORES DE INTERACCIÓN ---

  const handleAnswerChange = (questionId, answer) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    setSelectedAnswers(prev => {
      if (question.tipo === 'multiple') {
        const currentAnswers = prev[questionId]?.answers || [];
        const newAnswers = currentAnswers.includes(answer)
          ? currentAnswers.filter(a => a !== answer)
          : [...currentAnswers, answer];
        return { ...prev, [questionId]: { answers: newAnswers, time: 0 } };
      } else {
        return { ...prev, [questionId]: { answers: answer, time: 0 } };
      }
    });
  };

  const goToNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      // Guardar el tiempo de la pregunta actual antes de pasar a la siguiente
      const responseTime = Math.floor((Date.now() - questionStartTime.current) / 1000);
      const questionId = questions[currentQuestionIndex].id;
      setSelectedAnswers(prev => ({
        ...prev,
        [questionId]: {
          answers: prev[questionId]?.answers,
          time: (prev[questionId]?.time || 0) + responseTime
        }
      }));
      // Pasar a la siguiente
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex => prevIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const userData = JSON.parse(localStorage.getItem('userData'));

    if (!userData) {
        setError("No se encontraron datos de usuario. Por favor, inicia sesión de nuevo.");
        setSubmitting(false);
        return;
    }

    // Calcular el tiempo de la última pregunta
    const lastQuestionId = questions[currentQuestionIndex].id;
    const lastResponseTime = Math.floor((Date.now() - questionStartTime.current) / 1000);
    const finalAnswers = {
        ...selectedAnswers,
        [lastQuestionId]: {
            answers: selectedAnswers[lastQuestionId]?.answers,
            time: (selectedAnswers[lastQuestionId]?.time || 0) + lastResponseTime
        }
    }

    try {
      const responsesPayload = questions.map(q => {
        const answerData = finalAnswers[q.id];
        const selected = answerData?.answers;

        let isCorrect = false;
        if (q.tipo === 'simple') {
          isCorrect = selected === q.respuestaCorrecta;
        } else if (q.tipo === 'multiple') {
          const correct = q.respuestaCorrecta || [];
          const selectedArr = Array.isArray(selected) ? selected : [];
          isCorrect = correct.length === selectedArr.length && correct.every(a => selectedArr.includes(a));
        }

        return {
          userId: userData.id,
          eventoId: userData.eventoId,
          questionId: q.id,
          estacionId: parseInt(stationId),
          respuestaSeleccionada: selected || null, // Enviar null si no hay respuesta
          esCorrecta: isCorrect,
          tiempoRespuesta: answerData?.time || 0,
          estado: 'completado'
        };
      });

      await api.post('/responses/batch', { responses: responsesPayload });
      
      // Lógica de navegación mejorada
      const currentStationOrder = station.orden;
      if (currentStationOrder < totalStations) {
        const nextStation = currentStationOrder + 1;
        navigate(`/stations`); // Volver a la lista para que el usuario elija la proxima
      } else {
        // Es la última estación, volver a la página de estaciones principal
        navigate('/stations');
      }

    } catch (err) {
      console.error('Error al enviar respuestas:', err);
      setError('Hubo un problema al guardar tus respuestas. Por favor, inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- RENDERIZADO CONDICIONAL ---
  if (loading) {
    return <div className="min-h-screen px-4 py-12"><QuizSkeleton /></div>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-center">
        <div className="bg-red-800 p-8 rounded-lg shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4">Ha ocurrido un error</h2>
            <p className="text-white">{error}</p>
            <button onClick={() => navigate('/stations')} className="mt-6 bg-gold-orange text-white px-6 py-2 rounded-lg">Volver a las Estaciones</button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
       <div className="flex items-center justify-center min-h-screen text-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4">Estación en Mantenimiento</h2>
            <p className="text-white">Actualmente no hay preguntas disponibles para esta estación. Vuelve a intentarlo más tarde.</p>
            <button onClick={() => navigate('/stations')} className="mt-6 bg-gold-orange text-white px-6 py-2 rounded-lg">Volver a las Estaciones</button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const selected = selectedAnswers[currentQuestion.id]?.answers;

  return (
    <div className="min-h-screen px-4 py-12 bg-cover bg-center" style={{ backgroundImage: 'url(/background-stars.webp)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-gold-orange text-4xl font-bold font-saint-seiya">QUIZZ</h1>
            <StationImage stationId={station.orden || station.id} className="h-24 w-auto object-contain" />
        </div>

        {/* Pregunta Actual */}
        <div className="bg-white bg-opacity-10 rounded-lg p-6 mb-6">
          <p className="text-white text-xl mb-6 font-semibold">{currentQuestion.texto}</p>
          <div className="space-y-3 mt-4">
            {currentQuestion.opciones.map((opcion, index) => {
              const isSelected = Array.isArray(selected)
                ? selected.includes(opcion)
                : selected === opcion;
              return (
                <button
                  key={index}
                  onClick={() => handleAnswerChange(currentQuestion.id, opcion)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${isSelected ? 'bg-sky-blue/30 border-sky-blue' : 'bg-white/10 border-white/30 hover:border-sky-blue'}`}>
                  <span className="text-white text-lg">{opcion}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navegación y Progreso */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={goToPrevious} disabled={currentQuestionIndex === 0} className="bg-gray-600 text-white px-6 py-3 rounded-lg disabled:opacity-50 transition-opacity">Anterior</button>
          <span className="text-white font-semibold">{currentQuestionIndex + 1} / {questions.length}</span>
          {currentQuestionIndex < questions.length - 1 ? (
            <button onClick={goToNext} className="bg-gold-orange text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-opacity">Siguiente</button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} className="bg-green-500 text-white px-6 py-3 rounded-lg disabled:opacity-50 hover:bg-green-400 transition-opacity">{submitting ? 'Enviando...' : 'Finalizar y Enviar'}</button>
          )}
        </div>
        
         {/* Modal de QR */}
        {showQRCode && <QRCodeModal url={window.location.href} onClose={() => setShowQRCode(false)} />}

      </div>
    </div>
  );
};

export default Quiz;
