import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState } from 'react'

const QRCodeModal = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState('')

  useEffect(() => {
    if (isOpen) {
      setUrl(window.location.href)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-castle-blue">Código QR</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        <div className="flex flex-col items-center space-y-4">
          {url && <QRCodeSVG value={url} size={256} />}
          <p className="text-sm text-gray-600 text-center break-all">
            {url}
          </p>
          <p className="text-xs text-gray-500 text-center">
            Escanea este código para compartir esta página
          </p>
        </div>
      </div>
    </div>
  )
}

export default QRCodeModal

