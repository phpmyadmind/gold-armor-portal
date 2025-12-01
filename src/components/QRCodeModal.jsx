import React from 'react';
import QRCode from 'qrcode.react';

const QRCodeModal = ({ url, onClose }) => {
  if (!url) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl text-center">
        <h2 className="text-2xl font-bold mb-4">Scan QR Code</h2>
        <QRCode value={url} size={256} />
        <p className="mt-4 text-gray-600">{url}</p>
        <button
          onClick={onClose}
          className="mt-6 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default QRCodeModal;
