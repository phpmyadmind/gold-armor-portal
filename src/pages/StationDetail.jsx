import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import StationImage from '../components/StationImage'
import { useEventSettings } from '../hooks/useEventSettings'
import ResourceModal from '../components/ResourceModal' // Importar el modal

const StationDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { settings } = useEventSettings()
  const [station, setStation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasCompleted, setHasCompleted] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false) // Estado para el modal

  useEffect(() => {
    const fetchStation = async () => {
      try {
        const response = await api.get(`/stations/${id}`)
        setStation(response.data)
        
        const userData = JSON.parse(localStorage.getItem('userData'))
        if (userData) {
          const completedResponse = await api.get(`/responses/station/${id}/completed`)
          setHasCompleted(completedResponse.data.completed)
        }
      } catch (error) {
        console.error('Error al cargar estación:', error)
        setStation({
          id: parseInt(id),
          nombre: `Estación ${id}`,
          problema: 'Para vencer al dragón, primero debemos conocerlo',
          videoUrl: null,
          descripcion: ''
        })
      } finally {
        setLoading(false)
      }
    }
    fetchStation()
  }, [id])

  // Aplicar fondo al `body` según la estación (reactivo a cambios de tamaño)
  useEffect(() => {
    const prevStyle = {
      backgroundImage: document.body.style.backgroundImage,
      backgroundSize: document.body.style.backgroundSize,
      backgroundRepeat: document.body.style.backgroundRepeat,
      backgroundPosition: document.body.style.backgroundPosition,
    };

    const backgrounds = {
      '2': {
        desktop: '/Fondos/Fondo_Hor_Amarillo.png',
        mobile: '/Fondos/Fondo_ver_Amarillo.png',
      },
      '3': {
        desktop: '/Fondos/Fondo_Hor_Morado.png',
        mobile: '/Fondos/Fondo_ver_Morado.png',
      },
      '4': {
        desktop: '/Fondos/Fondo_Hor_Azul-claro.png',
        mobile: '/Fondos/Fondo_ver_Azul-claro.png',
      },
    };

    const mq = (typeof window !== 'undefined' && window.matchMedia) ? window.matchMedia('(max-width: 768px)') : null;

    const applyBackground = () => {
      const bg = backgrounds[id];
      if (!bg) return;
      const isMobile = mq ? mq.matches : false;
      const chosen = isMobile ? bg.mobile : bg.desktop;
      document.body.style.backgroundImage = `url("${chosen}")`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundRepeat = 'no-repeat';
      document.body.style.backgroundPosition = 'center top';
    };

    // Aplicar inicialmente
    applyBackground();

    // Escuchar cambios de media query para actualizar el fondo reactivo al redimensionar
    const handleChange = () => applyBackground();
    if (mq) {
      if (mq.addEventListener) mq.addEventListener('change', handleChange);
      else mq.addListener(handleChange);
    }

    return () => {
      // Remover listener
      if (mq) {
        if (mq.removeEventListener) mq.removeEventListener('change', handleChange);
        else mq.removeListener(handleChange);
      }
      // Restaurar estilos previos
      document.body.style.backgroundImage = prevStyle.backgroundImage || '';
      document.body.style.backgroundSize = prevStyle.backgroundSize || '';
      document.body.style.backgroundRepeat = prevStyle.backgroundRepeat || '';
      document.body.style.backgroundPosition = prevStyle.backgroundPosition || '';
    };
  }, [id]);

  // Cambiar favicon solo en /station/2
  useEffect(() => {
    const link = document.querySelector("link[rel~='icon']");
    if (!link) return;
    const prevHref = link.href;

    if (id === '2') {
      // logo azul en /Fondos
      link.href = '/Fondos/Logo-ArmadurasAzul.png';
    }

    return () => {
      // restaurar favicon anterior
      try { link.href = prevHref || '/LOGO_ARMADURAS.png'; } catch (e) { /* ignore */ }
    };
  }, [id]);

  const handleStartQuiz = () => {
    navigate(`/station/${id}/quiz`)
  }

  const handleOpenModal = () => {
    if (station?.videoUrl || settings?.resourcesLink) {
        setIsModalOpen(true)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    )
  }
  
  // Determinar qué URL usar: la específica de la estación o la general del evento.
  const resourceUrl = station?.videoUrl || settings?.resourcesLink;

  // Función para detectar el tipo de recurso
  const getResourceType = (url) => {
    try {
      const ext = new URL(url).pathname.split('.').pop().toLowerCase();
      if (ext === 'mp4' || ext === 'webm') return { icon: '🎬', label: 'Ver video' };
      if (ext === 'pptx' || ext === 'ppt') return { icon: '📊', label: 'Ver presentación' };
      if (ext === 'pdf') return { icon: '📄', label: 'Ver PDF' };
      if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return { icon: '🖼️', label: 'Ver imagen' };
      return { icon: '📁', label: 'Ver recurso' };
    } catch (e) {
      return { icon: '📁', label: 'Ver recurso' };
    }
  };

  const resourceType = getResourceType(resourceUrl);

  // Obtener logo según la estación
  const getHeaderLogo = () => {
    const logos = {
      '2': '/Fondos/Logo-ArmadurasAzul.png', // Puedes cambiar según necesites
    };
    return logos[id] || '/LOGO_ARMADURAS.png';
  };

  // Obtener color de botones según la estación
  const getButtonColor = () => {
    if (id === '2') {
      return '#183e90'; // Azul oscuro para estación 2
    }
    return null; // usa el color por defecto (gold-orange)
  };

  const buttonColor = getButtonColor();
  const buttonClasses = buttonColor 
    ? 'text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-colors'
    : 'bg-gold-orange text-white px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors';
  const buttonStyle = buttonColor ? { backgroundColor: buttonColor } : {};

  // Archivos descargables para estación 3
  const station3Downloads = id === '3' ? [
    { name: 'Descargar PPTX', url: '/uploads/estacion-3.pptx', icon: '📊' },
    { name: 'Descargar PDF', url: '/uploads/estacion-3.pdf', icon: '📄' },
  ] : [];

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-center mb-12">
          <img 
            src={getHeaderLogo()} 
            alt="Logo"
            className="h-24 md:h-32 object-contain drop-shadow-lg"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0 flex justify-center md:justify-start">
            <StationImage stationId={id} />
          </div>

          <div className="flex-1 space-y-8">
            <div>
              <h2 className="text-white text-2xl font-bold mb-4">{station?.problema}</h2>
              <p className="text-white text-lg mb-6">
                {station?.descripcion || 'Para vencer al dragón, primero debemos conocerlo'}
              </p>
              {resourceUrl && (
                <button 
                  onClick={handleOpenModal}
                  className={buttonClasses}
                  style={buttonStyle}
                >
                  <span>{resourceType.icon}</span>
                  <span>{resourceType.label}</span>
                </button>
              )}
            </div>

            <div>
              <h2 className="text-white text-3xl font-bold mb-4">QUIZZ</h2>
              {hasCompleted ? (
                <div className="bg-green-500 bg-opacity-20 border border-green-500 rounded-lg p-4 mb-4">
                  <p className="text-white">✓ Ya has completado el quiz de esta estación</p>
                </div>
              ) : (
                <button
                  onClick={handleStartQuiz}
                  className={buttonClasses}
                  style={buttonStyle}
                >
                  Realizar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <ResourceModal url={resourceUrl} onClose={handleCloseModal} allowDownload={id === '3'} />
      )}
    </div>
  )
}

export default StationDetail
