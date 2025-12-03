import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const EventDesigner = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  // Estado inicializado con todos los campos y valores por defecto seguros
  const [design, setDesign] = useState({
    bodyBgColor: '#FFFFFF', buttonBgColor: '#000000', buttonTextColor: '#FFFFFF',
    buttonHoverBgColor: '#333333', buttonHoverTextColor: '#FFFFFF', buttonBorderRadius: '8px',
    footerBgColor: 'transparent', authTitle: '', authSubtitle: '', loginTitle: '', 
    registerTitle: '', authFlow: 'unified', showName: true, showCompany: false, showPosition: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/events').then(res => setEvents(res.data)).catch(() => setError('No se pudieron cargar los eventos.'));
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      setLoading(true);
      api.get(`/designs/event/${selectedEvent.id}`)
        .then(res => setDesign(prev => ({ ...prev, ...res.data })))
        .catch(() => setDesign(prev => ({ ...prev, bodyBgColor: '#FFFFFF' }))) // Mantener defaults en caso de 404
        .finally(() => setLoading(false));
    }
  }, [selectedEvent]);

  const handleEventChange = useCallback(e => {
    const event = events.find(ev => ev.id === parseInt(e.target.value));
    setSelectedEvent(event);
  }, [events]);

  const handleInputChange = useCallback(e => {
    const { name, value, type, checked } = e.target;
    setDesign(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }, []);

  const handleFileChange = useCallback(e => {
    const { name, files } = e.target;
    setDesign(prev => ({ ...prev, [name]: files[0] }));
  }, []);

  const handleSubmit = useCallback(async e => {
    e.preventDefault();
    if (!selectedEvent) return;

    const formData = new FormData();
    for (const [key, value] of Object.entries(design)) {
        // Asegurarse de que los booleanos se envíen como strings 'true'/'false'
        const valueToSend = typeof value === 'boolean' ? String(value) : value;
        if (valueToSend !== null && valueToSend !== undefined) {
            formData.append(key, valueToSend);
        }
    }

    setLoading(true);
    setError('');
    try {
      await api.put(`/designs/event/${selectedEvent.id}`, formData, { 
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('¡Diseño guardado con éxito!');
    } catch (err) {
      setError(`Error al guardar: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  }, [design, selectedEvent]);

  return (
    <div className="min-h-screen px-4 py-12 bg-gray-100">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">Diseñador de Eventos</h1>
        
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">{error}</div>}

        <div className="mb-8">
          <label htmlFor="event-select" className="block text-lg font-medium mb-2 text-gray-700">Selecciona un Evento</label>
          <select id="event-select" onChange={handleEventChange} className="w-full p-3 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500">
            <option value="">-- Elige un evento --</option>
            {events.map(event => <option key={event.id} value={event.id}>{event.nombre}</option>)}
          </select>
        </div>

        {selectedEvent && (
          <form onSubmit={handleSubmit} className="space-y-10">
            {loading && <div className="text-center font-semibold text-blue-600">Cargando...</div>}

            <FormSection title="Colores y Fondos">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <InputField label="Fondo Cuerpo" type="color" name="bodyBgColor" value={design.bodyBgColor || ''} onChange={handleInputChange} />
                <FileInput label="Imagen Fondo Cuerpo" name="bodyBgImage" onChange={handleFileChange} currentFile={design.bodyBgImage} />
                <InputField label="Fondo Pie" type="color" name="footerBgColor" value={design.footerBgColor || ''} onChange={handleInputChange} />
                <FileInput label="Imagen Fondo Pie" name="footerBgImage" onChange={handleFileChange} currentFile={design.footerBgImage} />
              </div>
            </FormSection>

            <FormSection title="Archivos y Logos">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FileInput label="Logo Cabecera" name="headerLogo" onChange={handleFileChange} currentFile={design.headerLogo} />
                <FileInput label="Logo Página" name="pageLogo" onChange={handleFileChange} currentFile={design.pageLogo} />
                <FileInput label="Fuente (.ttf)" name="fontFile" onChange={handleFileChange} currentFile={design.fontFile} accept=".ttf" />
              </div>
            </FormSection>

            <FormSection title="Estilo de Botones">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <InputField label="Fondo" type="color" name="buttonBgColor" value={design.buttonBgColor || ''} onChange={handleInputChange} />
                    <InputField label="Texto" type="color" name="buttonTextColor" value={design.buttonTextColor || ''} onChange={handleInputChange} />
                    <InputField label="Fondo Hover" type="color" name="buttonHoverBgColor" value={design.buttonHoverBgColor || ''} onChange={handleInputChange} />
                    <InputField label="Texto Hover" type="color" name="buttonHoverTextColor" value={design.buttonHoverTextColor || ''} onChange={handleInputChange} />
                    <InputField label="Borde Radio" name="buttonBorderRadius" value={design.buttonBorderRadius || ''} onChange={handleInputChange} placeholder="Ej: 8px" />
                </div>
            </FormSection>
            
            <FormSection title="Textos de Autenticación">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Título Principal" name="authTitle" value={design.authTitle || ''} onChange={handleInputChange} placeholder="Acceso al Evento" />
                    <InputField label="Subtítulo" name="authSubtitle" value={design.authSubtitle || ''} onChange={handleInputChange} placeholder="Ingresa o regístrate" />
                    <InputField label="Título Login" name="loginTitle" value={design.loginTitle || ''} onChange={handleInputChange} placeholder="Iniciar Sesión" />
                    <InputField label="Título Registro" name="registerTitle" value={design.registerTitle || ''} onChange={handleInputChange} placeholder="Crear Cuenta" />
                </div>
            </FormSection>

            <FormSection title="Flujo y Campos de Autenticación">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Flujo de Login/Registro</label>
                        <select name="authFlow" value={design.authFlow || 'unified'} onChange={handleInputChange} className="w-full p-2 border rounded-md">
                            <option value="unified">Unificado</option>
                            <option value="separate">Separado</option>
                        </select>
                    </div>
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-600">Campos Visibles en Registro</label>
                        <CheckboxField label="Mostrar Nombre Completo" name="showName" checked={design.showName || false} onChange={handleInputChange} />
                        <CheckboxField label="Mostrar Empresa" name="showCompany" checked={design.showCompany || false} onChange={handleInputChange} />
                        <CheckboxField label="Mostrar Cargo" name="showPosition" checked={design.showPosition || false} onChange={handleInputChange} />
                    </div>
                </div>
            </FormSection>

            <button type="submit" disabled={loading || !selectedEvent} className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-md shadow-lg transform hover:scale-105 transition-transform">
              {loading ? 'Guardando...' : 'Guardar Diseño'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// --- Componentes Auxiliares ---

const FormSection = ({ title, children }) => (
  <div className="p-6 border rounded-lg bg-gray-50"><h3 className="text-2xl font-semibold mb-6 text-gray-700 border-b pb-2">{title}</h3>{children}</div>
);

const InputField = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-600 mb-2">{label}</label>
    <input {...props} className={`w-full p-2 border rounded-md shadow-sm ${props.type === 'color' ? 'h-12' : ''}`} />
  </div>
);

const FileInput = ({ label, name, onChange, currentFile }) => (
    <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">{label}</label>
        <input type="file" name={name} onChange={onChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-blue-100 hover:file:bg-blue-200" />
        {currentFile && typeof currentFile === 'string' && <p className="text-xs mt-2">Actual: {currentFile.split('/').pop()}</p>}
    </div>
);

const CheckboxField = ({ label, ...props }) => (
    <label className="flex items-center space-x-3">
        <input type="checkbox" {...props} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
        <span className="text-gray-700">{label}</span>
    </label>
);

export default EventDesigner;
