const Footer = ({ onQRClick }) => {
  return (
    <footer className="py-3 px-3 relative mt-5" style={{ zIndex: 20 }}>
      <div className="max-w-5xl mx-auto relative">
        {/* Logos y QR */}
        <div className="flex items-center justify-center flex-wrap gap-4 mb-4">
          <div className="flex items-center space-x-6">
            <div className="text-white text-sm drop-shadow-lg">
              <div className="flex justify-center items-center space-x-4">
                <img
                  src="/Logos_Astra_SCP.png"
                  alt="AZ y SCP"
                  className="h-20 md:h-24 object-contain"
                />
              </div>
            </div>
          </div>
          {/* Botón QR */}
          <button
            onClick={onQRClick}
            className="bg-black bg-opacity-50 p-3 rounded-lg hover:bg-opacity-70 transition-colors flex items-center justify-center backdrop-blur-sm"
            title="Ver código QR"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm0 4h3v2h-3v-2zm-4-4h3v2h-3v-2zm4 6h3v2h-3v-2zm-4 0h3v2h-3v-2z" />
            </svg>
          </button>
        </div>
        {/* Disclaimer */}
        <p className="text-white text-xs text-center mb-20 drop-shadow-lg">
          Material dirigido y para uso exclusivo de empleados de AZ. Información confidencial. No distribuir
        </p>
      </div>
    </footer>
  )
}

export default Footer

