import React, { useRef } from 'react';
import QRCode from 'qrcode.react';

const QRCodeModal = ({ url, onClose }) => {
  const qrRef = useRef();

  if (!url) return null;

  const handleDownload = () => {
    const canvas = qrRef.current.querySelector('canvas');
    const imageSrc = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = 'qrcode.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl text-center">
        <h2 className="text-2xl font-bold mb-4">Scan QR Code</h2>
        <div ref={qrRef}>
          <QRCode value={url} size={256} />
        </div>
        <p className="mt-4 text-gray-600 break-all">{url}</p>
        <div className="mt-6">
          <button
            onClick={handleDownload}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 mr-2"
          >
            Download PNG
          </button>
          <button
            onClick={onClose}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
