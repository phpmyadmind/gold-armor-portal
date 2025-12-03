import { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * Hook para obtener la configuración de diseño del evento ACTIVO.
 * Llama al endpoint /designs/event/active para obtener los estilos
 * y los devuelve. Es independiente del usuario.
 */
export const useEventSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveEventDesign = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/designs/event/active');
        setSettings(data);
      } catch (error) {
        console.error('No se pudo cargar el diseño del evento activo:', error.response?.data?.message || error.message);
        // Si no hay diseño, se usa un objeto vacío para evitar errores
        setSettings({}); 
      } finally {
        setLoading(false);
      }
    };

    fetchActiveEventDesign();
  }, []); // Se ejecuta solo una vez al cargar la app

  return { settings, loading };
};
