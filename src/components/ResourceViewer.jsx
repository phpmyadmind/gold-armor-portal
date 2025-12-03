import React, { useState, useEffect, useRef } from 'react';

const ResourceViewer = ({ url, allowDownload = false }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const containerRef = useRef(null);

  if (!url) return null;

  const getFileExtension = (urlString) => {
    try {
      return new URL(urlString).pathname.split('.').pop().toLowerCase();
    } catch (e) {
      return '';
    }
  };

  const getFileName = (urlString) => {
    try {
      return new URL(urlString).pathname.split('/').pop();
    } catch (e) {
      return 'Archivo';
    }
  };

  const extension = getFileExtension(url);
  const fileName = getFileName(url);

  // Carga de PDF y PPTX con Nutrient Web SDK (sin cambios)
  useEffect(() => {
    const container = containerRef.current;
    if (extension !== 'pdf' && extension !== 'pptx' && extension !== 'ppt') return;

    let cleanup = () => {};

    (async () => {
      try {
        const NutrientViewer = (await import("@nutrient-sdk/viewer")).default;
        NutrientViewer.unload(container);
        if (container && NutrientViewer) {
          NutrientViewer.load({
            container,
            document: url,
            baseUrl: `${window.location.protocol}//${window.location.host}/`,
          });
          setIsLoading(false);
        }
        cleanup = () => {
          NutrientViewer.unload(container);
        };
      } catch (err) {
        console.error('Error al cargar Nutrient Viewer:', err);
        setError(true);
        setIsLoading(false);
      }
    })();

    return cleanup;
  }, [url, extension]);

  // Videos (sin cambios)
  if (extension === 'mp4' || extension === 'webm') {
    return (
      <div className="w-full relative">
        <video 
          controls 
          autoPlay 
          className="w-full h-auto max-h-[70vh] bg-black rounded-lg"
          onLoadStart={() => setIsLoading(true)}
          onCanPlay={() => setIsLoading(false)}
          onError={() => setError(true)}
        >
          <source src={url} type={`video/${extension}`} />
          Tu navegador no soporta la etiqueta de video.
        </video>
        {error && (
          <div className="p-4 bg-red-100 rounded-lg text-center text-red-600">
            Error al cargar el video
          </div>
        )}
      </div>
    );
  }

  // --- IMÁGENES (VISUALIZADOR SIMPLIFICADO) ---
  if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
    return (
      <div className="w-full flex justify-center items-center bg-black bg-opacity-20 rounded-lg p-4" style={{ minHeight: '50vh' }}>
        {isLoading && (
          <div className="absolute flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-orange"></div>
          </div>
        )}
        {error && !isLoading && (
            <div className="p-4 bg-red-100 rounded-lg text-center text-red-600">
              Error al cargar la imagen.
            </div>
        )}
        <img
          src={url}
          alt="Recurso visual"
          className={`max-w-full max-h-[80vh] object-contain rounded-lg transition-opacity duration-300 ${isLoading || error ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setError(true);
          }}
        />
      </div>
    );
  }

  // PDF y PPTX (renderizado del contenedor, sin cambios)
  if (extension === 'pdf' || extension === 'pptx' || extension === 'ppt') {
    const typeLabel = extension === 'pdf' ? 'Documento PDF' : 'Presentación PowerPoint';
    return (
      <div className="w-full">
        {/* ... (código del contenedor de PDF/PPTX sin cambios) ... */}
      </div>
    );
  }

  // Archivo desconocido (sin cambios)
  return (
    <div className="w-full">
        {/* ... (código para archivos desconocidos sin cambios) ... */}
    </div>
  );
};

export default ResourceViewer;
