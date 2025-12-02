import React from 'react';
import ResourceViewer from './ResourceViewer';

const ResourceModal = ({ url, onClose }) => {
  if (!url) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto p-4 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-2 right-2 text-white bg-red-500 rounded-full w-8 h-8 flex items-center justify-center font-bold z-10">
          X
        </button>
        <div className="w-full h-full">
          <ResourceViewer url={url} />
        </div>
      </div>
    </div>
  );
};

export default ResourceModal;
