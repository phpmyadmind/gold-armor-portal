import React, { useState } from 'react';

const ResourceViewer = ({ url }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

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

  // Imágenes
  if (extension === 'jpg' || extension === 'jpeg' || extension === 'png' || extension === 'gif') {
    return (
      <div className="w-full flex justify-center relative">
        {isLoading && (
          <div className="absolute flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-orange"></div>
          </div>
        )}
        <img 
          src={url} 
          alt="Recurso" 
          className="max-w-full max-h-[70vh] object-contain rounded-lg"
          onLoad={() => setIsLoading(false)}
          onError={() => setError(true)}
        />
        {error && (
          <div className="p-4 bg-red-100 rounded-lg text-center text-red-600">
            Error al cargar la imagen
          </div>
        )}
      </div>
    );
  }

  // PDF
  if (extension === 'pdf') {
    return (
      <div className="w-full">
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-800 font-semibold mb-2">Documento PDF</p>
          <p className="text-sm text-blue-700">Visualizando: {fileName}</p>
        </div>

        <div className="w-full bg-gray-100 rounded-lg overflow-hidden border border-gray-300">
          <iframe
            src={`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`}
            style={{
              width: '100%',
              height: '70vh',
              border: 'none',
              borderRadius: '0.5rem',
            }}
            onLoad={() => setIsLoading(false)}
            onError={() => setError(true)}
            title="PDF Viewer"
            className="rounded-lg"
          />
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-lg">
              <div className="text-center p-4">
                <p className="text-red-600 font-semibold mb-4">Error al cargar el PDF</p>
                <a 
                  href={url} 
                  download 
                  className="inline-block bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                >
                  Descargar PDF
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // PPTX / PPT
  if (extension === 'pptx' || extension === 'ppt') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
      return (
        <div className="w-full">
          <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-yellow-800 font-semibold mb-2">Presentacion PowerPoint</p>
            <p className="text-sm text-yellow-700">Visualizando: {fileName}</p>
          </div>

          <div className="w-full bg-yellow-50 rounded-lg overflow-hidden border border-yellow-300 p-8 text-center">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-yellow-900 mb-2">Presentacion PowerPoint</h3>
              <p className="text-yellow-800 mb-4">
                La visualizacion de archivos PowerPoint requiere una URL publica. En localhost usa la opcion de descarga.
              </p>
            </div>

            <div className="flex flex-col gap-3 justify-center">
              <a 
                href={url} 
                download 
                className="inline-block bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors font-semibold"
              >
                Descargar {extension.toUpperCase()}
              </a>
              <p className="text-sm text-yellow-700">
                O copia esta URL para ver en linea:
              </p>
              <code className="bg-white p-2 rounded border border-yellow-300 text-xs text-left overflow-auto">
                {url}
              </code>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full">
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-800 font-semibold mb-2">Presentacion PowerPoint</p>
          <p className="text-sm text-blue-700">Visualizando: {fileName}</p>
        </div>

        <div className="w-full bg-gray-100 rounded-lg overflow-hidden border border-gray-300 relative" style={{ height: '70vh' }}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-orange"></div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-20 rounded-lg">
              <div className="text-center p-4">
                <p className="text-red-600 font-semibold mb-4">Error al cargar la presentacion</p>
                <a 
                  href={url} 
                  download 
                  className="inline-block bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                >
                  Descargar PPTX
                </a>
              </div>
            </div>
          )}

          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
            style={{
              width: '100%',
              height: '70vh',
              border: 'none',
              borderRadius: '0.5rem',
            }}
            onLoad={() => setIsLoading(false)}
            onError={() => setError(true)}
            title="PowerPoint Viewer"
            className="rounded-lg"
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

        <a 
          href={url} 
          download 
          className="inline-block bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors font-semibold"
        >
          Descargar {extension.toUpperCase()}
        </a>
      </div>
    </div>
  );
};

export default ResourceViewer;