import React, { useState, useEffect, useRef } from 'react';

const ResourceViewer = ({ url, allowDownload = false, disableMagnifier = false }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const [showLens, setShowLens] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [lensSize] = useState(160);
  const [zoom] = useState(2.2);

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

  // PDF y PPTX usando Nutrient Web SDK
  useEffect(() => {
    const container = containerRef.current;
    if (extension !== 'pdf' && extension !== 'pptx' && extension !== 'ppt') return;

    let cleanup = () => {};

    (async () => {
      try {
        const NutrientViewer = (await import("@nutrient-sdk/viewer")).default;
        
        // Asegurar que solo hay una instancia
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

  const handleMouseMove = (e) => {
    const img = imgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const posX = Math.max(0, Math.min(x, rect.width));
    const posY = Math.max(0, Math.min(y, rect.height));
    setLensPos({ x: posX, y: posY });
  };

  const handleMouseEnter = () => setShowLens(true);
  const handleMouseLeave = () => setShowLens(false);

  // Videos
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

  // Imágenes con efecto lupa (magnifier)
  if (extension === 'jpg' || extension === 'jpeg' || extension === 'png' || extension === 'gif') {

    return (
      <div className="w-full flex justify-center relative">
        {isLoading && (
          <div className="absolute flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-orange"></div>
          </div>
        )}

        <div className="relative rounded-lg overflow-hidden" style={{ maxWidth: '100%', maxHeight: '80vh' }}>
          <img
            ref={imgRef}
            src={url}
            alt="Recurso"
            className="block max-w-full max-h-[80vh] object-contain"
            onLoad={() => setIsLoading(false)}
            onError={() => setError(true)}
            onMouseMove={!disableMagnifier ? handleMouseMove : undefined}
            onMouseEnter={!disableMagnifier ? handleMouseEnter : undefined}
            onMouseLeave={!disableMagnifier ? handleMouseLeave : undefined}
            style={{ display: 'block' }}
          />

          {/* Capa blanca que oculta la imagen; solo si el magnifier está activado */}
          {!disableMagnifier && (
            <div
              aria-hidden
              className="absolute inset-0 bg-white z-20 pointer-events-none"
              style={{ opacity: 1 }}
            />
          )}

          {/* Lupa: muestra la porción de imagen solo donde está la lupa */}
          {!disableMagnifier && showLens && !error && (
            <div
              aria-hidden
              className="pointer-events-none rounded-full border border-gray-300 shadow-lg"
              style={{
                position: 'absolute',
                left: Math.max(0, lensPos.x - lensSize / 2),
                top: Math.max(0, lensPos.y - lensSize / 2),
                width: lensSize,
                height: lensSize,
                backgroundImage: `url(${url})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: `${(imgRef.current?.naturalWidth || 0) * zoom}px ${(imgRef.current?.naturalHeight || 0) * zoom}px`,
                backgroundPosition: (() => {
                  const img = imgRef.current;
                  if (!img) return '0px 0px';
                  const rect = img.getBoundingClientRect();
                  const rx = (img.naturalWidth / rect.width);
                  const ry = (img.naturalHeight / rect.height);
                  const bgX = -((lensPos.x * rx * zoom) - lensSize / 2);
                  const bgY = -((lensPos.y * ry * zoom) - lensSize / 2);
                  return `${bgX}px ${bgY}px`;
                })(),
                zIndex: 30,
              }}
            />
          )}

        </div>

        {error && (
          <div className="p-4 bg-red-100 rounded-lg text-center text-red-600 absolute z-20">
            Error al cargar la imagen
          </div>
        )}
      </div>
    );
  }

  // PDF y PPTX usando Nutrient Web SDK
  if (extension === 'pdf' || extension === 'pptx' || extension === 'ppt') {
    const typeLabel = extension === 'pdf' ? 'Documento PDF' : 'Presentación PowerPoint';

    return (
      <div className="w-full">
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-800 font-semibold mb-2">{typeLabel}</p>
          <p className="text-sm text-blue-700">Visualizando: {fileName}</p>
        </div>

        <div className="w-full bg-gray-100 rounded-lg overflow-hidden border border-gray-300 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20 rounded-lg">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-orange"></div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-20 rounded-lg">
              <div className="text-center p-4">
                <p className="text-red-600 font-semibold mb-4">Error al cargar {typeLabel.toLowerCase()}</p>
                {allowDownload ? (
                  <a 
                    href={url} 
                    download 
                    className="inline-block bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                  >
                    Descargar {extension.toUpperCase()}
                  </a>
                ) : (
                  <p className="text-sm text-red-600">Descarga no permitida en esta estación</p>
                )}
              </div>
            </div>
          )}

          <div 
            ref={containerRef} 
            style={{ 
              height: '70vh', 
              width: '100%',
              borderRadius: '0.5rem'
            }} 
          />
        </div>
      </div>
    );
  }

  // Archivo desconocido
  return (
    <div className="w-full">
      <div className="mb-4 p-4 bg-gray-100 rounded-lg border border-gray-300">
        <p className="text-gray-800 font-semibold mb-2">Archivo: {extension.toUpperCase()}</p>
        <p className="text-sm text-gray-700">Archivo: {fileName}</p>
      </div>

      <div className="w-full bg-gray-50 rounded-lg overflow-hidden border border-gray-300 p-8 text-center">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Tipo de archivo no soportado para visualizacion</h3>
          <p className="text-gray-600 mb-4">Descarga el archivo para verlo en tu ordenador.</p>
        </div>

        {allowDownload ? (
          <a 
            href={url} 
            download 
            className="inline-block bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors font-semibold"
          >
            Descargar {extension.toUpperCase()}
          </a>
        ) : (
          <p className="text-sm text-gray-600">Descarga no permitida en esta estación</p>
        )}
      </div>
    </div>
  );
};

export default ResourceViewer;