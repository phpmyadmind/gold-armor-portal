import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const EventDesigner = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [design, setDesign] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setEvents((await api.get('/events')).data);
      } catch (err) { setError('No se pudieron cargar los eventos.'); }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      const fetchDesign = async () => {
        setLoading(true);
        try {
          const res = await api.get(`/designs/event/${selectedEvent.id}`);
          setDesign(res.data || {});
        } catch (err) {
          setDesign({ bodyBgColor: '#FFFFFF' }); // Valor por defecto más limpio
        }
        setLoading(false);
      };
      fetchDesign();
    }
  }, [selectedEvent]);

  const handleEventChange = useCallback((e) => {
    const event = events.find(ev => ev.id === parseInt(e.target.value));
    setSelectedEvent(event);
  }, [events]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setDesign(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleFileChange = useCallback((e) => {
    const { name, files } = e.target;
    setDesign(prev => ({ ...prev, [name]: files[0] }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!selectedEvent) return;

    const formData = new FormData();
    Object.entries(design).forEach(([key, value]) => {
      if (value !== null && value !== undefined) formData.append(key, value);
    });

    setLoading(true);
    setError('');
    try {
      await api.put(`/designs/event/${selectedEvent.id}`, formData, { 
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Diseño guardado con éxito!');
    } catch (err) {
      setError('Error al guardar el diseño. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [design, selectedEvent]);

  return (
    <div className="min-h-screen px-4 py-12 bg-gray-100">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">Diseñador de Eventos</h1>
        
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">{error}</div>}

        <div className="mb-8">
          <label htmlFor="event-select" className="block text-lg font-medium mb-2 text-gray-700">Selecciona un Evento</label>
          <select id="event-select" onChange={handleEventChange} className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
            <option value="">-- Elige un evento --</option>
            {events.map(event => <option key={event.id} value={event.id}>{event.nombre}</option>)}
          </select>
        </div>

        {selectedEvent && (
          <form onSubmit={handleSubmit} className="space-y-10">
            {loading && <div className="text-center font-semibold text-blue-600">Cargando...</div>}

            <FormSection title="Configuración de Colores">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <InputField label="Fondo" type="color" name="bodyBgColor" value={design.bodyBgColor || ''} onChange={handleInputChange} />
                <InputField label="Botón" type="color" name="buttonBgColor" value={design.buttonBgColor || ''} onChange={handleInputChange} />
                <InputField label="Texto Botón" type="color" name="buttonTextColor" value={design.buttonTextColor || ''} onChange={handleInputChange} />
                <InputField label="Botón Hover" type="color" name="buttonHoverBgColor" value={design.buttonHoverBgColor || ''} onChange={handleInputChange} />
                <InputField label="Texto Hover" type="color" name="buttonHoverTextColor" value={design.buttonHoverTextColor || ''} onChange={handleInputChange} />
              </div>
            </FormSection>

            <FormSection title="Archivos y Logos">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FileInput label="Imagen de Fondo" name="bodyBgImage" onChange={handleFileChange} currentFile={design.bodyBgImage} />
                <FileInput label="Logo Cabecera" name="headerLogo" onChange={handleFileChange} currentFile={design.headerLogo} />
                <FileInput label="Logo Página" name="pageLogo" onChange={handleFileChange} currentFile={design.pageLogo} />
                <FileInput label="Fuente (.ttf)" name="fontFile" onChange={handleFileChange} currentFile={design.fontFile} accept=".ttf" />
              </div>
            </FormSection>

            <FormSection title="Estilo de Botones">
              <InputField label="Borde Radio (e.g., 8px, 1rem)" name="buttonBorderRadius" value={design.buttonBorderRadius || ''} onChange={handleInputChange} placeholder="Ej: 8px" />
            </FormSection>

            <button type="submit" disabled={loading || !selectedEvent} className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-md hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold shadow-lg transform hover:scale-105 transition-transform">
              {loading ? 'Guardando...' : 'Guardar Diseño'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// --- Componentes Auxiliares Optimizados ---

const FormSection = ({ title, children }) => (
  <div className="p-6 border rounded-lg bg-gray-50">
    <h3 className="text-2xl font-semibold mb-6 text-gray-700 border-b pb-2">{title}</h3>
    {children}
  </div>
);

const InputField = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-600 mb-2">{label}</label>
    <input {...props} className={`w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 ${props.type === 'color' ? 'h-12' : ''}`} />
  </div>
);

const FileInput = ({ label, name, onChange, currentFile, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-600 mb-2">{label}</label>
    <input type="file" name={name} onChange={onChange} {...props} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 transition" />
    {currentFile && typeof currentFile === 'string' && (
      <p className="text-xs text-gray-500 mt-2">Archivo actual: <span className="font-semibold">{currentFile.split('/').pop()}</span></p>
    )}
  </div>
);

export default EventDesigner;
