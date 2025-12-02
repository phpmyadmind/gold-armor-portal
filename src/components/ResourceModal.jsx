import React, { useState } from 'react';
import ResourceViewer from './ResourceViewer';

const ResourceModal = ({ url, onClose, allowDownload = false, disableMagnifier = false }) => {
  const [isLoading, setIsLoading] = useState(true);

  if (!url) return null;

  const getFileName = (urlString) => {
    try {
      return new URL(urlString).pathname.split('/').pop();
    } catch (e) {
      return 'Archivo';
    }
  };

  const fileName = getFileName(url);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-auto p-6 relative" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📄</span>
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">Recurso</h3>
              <p className="text-sm text-gray-600">{fileName}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors p-2"
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Contenido */}
        <div className="flex justify-center items-center">
          <ResourceViewer url={url} allowDownload={allowDownload} disableMagnifier={disableMagnifier} />
        </div>

        {/* Pie de página */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end gap-2">
          {allowDownload && (
            <a 
              href={url} 
              download 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-gold-orange text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors font-semibold"
            >
              ⬇️ Descargar
            </a>
          )}
          <button 
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResourceModal;
