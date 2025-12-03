import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// --- Componente de Esqueleto para la Carga ---
const StationButtonSkeleton = () => (
  <div className="w-full h-28 md:h-32 bg-gray-700 animate-pulse rounded-lg flex items-center justify-center p-6" />
);

// --- Componente Principal de Estaciones ---
const Stations = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStations = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/stations');
        // Ordenar las estaciones por el campo 'orden' antes de guardarlas
        const sortedStations = response.data.sort((a, b) => a.orden - b.orden);
        setStations(sortedStations);
      } catch (err) {
        console.error('Error al cargar estaciones:', err);
        setError('No se pudieron cargar las estaciones. Por favor, inténtalo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    fetchStations();
  }, []); // El array vacío asegura que se ejecute solo una vez

  // --- Renderizado Condicional ---

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-gold-orange text-4xl md:text-5xl font-bold text-center mb-8">
            ARMADURAS DE ORO
          </h1>
          <StationButtonSkeleton />
          <StationButtonSkeleton />
          <StationButtonSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-white bg-red-800 p-8 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-12 bg-cover bg-center" style={{ backgroundImage: 'url(/background-stars.webp)' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-gold-orange text-4xl md:text-5xl font-bold text-center mb-8 font-saint-seiya">
          ARMADURAS DE ORO
        </h1>
        <p className="text-white text-lg md:text-xl text-center mb-12 max-w-3xl mx-auto">
          Pon a prueba tu valentía, responde el quizz de cada estación y avanza en orden para demostrar que tú también puedes forjar esperanza y proteger vidas.
        </p>

        <div className="space-y-6 max-w-2xl mx-auto">
          {stations.map((station) => {
            // Lógica de imagen corregida: Usa station.imageUrl o un placeholder
            const stationImage = station.imageUrl || '/Estaciones-placeholder.png';

            return (
              <button
                key={station.id}
                onClick={() => navigate(`/station/${station.id}`)}
                className="w-full text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out hover:scale-105 shadow-lg flex items-center justify-between gap-4 bg-gradient-to-r from-yellow-500 to-amber-400 hover:from-yellow-400 hover:to-amber-300"
              >
                <img 
                  src={stationImage}
                  alt={station.nombre || 'Icono de Estación'}
                  className="h-16 md:h-20 w-auto object-contain flex-shrink-0 filter drop-shadow-lg"
                  onError={(e) => { e.target.src = '/Estaciones-placeholder.png'; }} // Fallback si la URL de la imagen falla
                />
                <span className="text-lg md:text-xl leading-tight font-saint-seiya tracking-wider">ESTACIÓN {station.orden || station.id}</span>
                <span className="text-2xl md:text-3xl font-saint-seiya">›</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Stations;
