import React from 'react';

const ResourceViewer = ({ url }) => {
  if (!url) return null;

  const getFileExtension = (url) => {
    try {
      return new URL(url).pathname.split('.').pop().toLowerCase();
    } catch (e) {
      return '';
    }
  };

  const extension = getFileExtension(url);

  switch (extension) {
    case 'mp4':
    case 'webm':
      return (
        <video controls autoPlay className="w-full h-full">
          <source src={url} type={`video/${extension}`} />
          Tu navegador no soporta la etiqueta de video.
        </video>
      );

    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return <img src={url} alt="Recurso" className="w-full h-auto object-contain" />;

    case 'pdf':
      return <iframe src={url} className="w-full h-full" title="Visor de PDF"></iframe>;

    case 'pptx':
        return (
            <div className="p-4 bg-gray-100 rounded-md text-center">
                <p className="text-lg font-semibold">Presentación de PowerPoint</p>
                <p className="text-sm mb-4">La previsualización no está disponible.</p>
                <a href={url} download target="_blank" rel="noopener noreferrer" className="mt-2 inline-block bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                    Descargar PPTX
                </a>
            </div>
        );

    default:
      return (
        <div className="p-4 bg-gray-100 rounded-md text-center">
            <p className="text-lg font-semibold">Tipo de archivo no soportado</p>
            <p className="text-sm mb-4">No se puede previsualizar este archivo.</p>
            <a href={url} download target="_blank" rel="noopener noreferrer" className="mt-2 inline-block bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">
                Descargar archivo
            </a>
        </div>
      );
  }
};

export default ResourceViewer;