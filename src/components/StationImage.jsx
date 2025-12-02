import { useState } from 'react'
import { Navigate } from 'react-router-dom'

// Componente reutilizable para mostrar imagen de estación con fallback
const StationImage = ({ stationId, className = "max-w-xs md:max-w-sm h-auto object-contain drop-shadow-2xl", size = "large" }) => {
  const [imageError, setImageError] = useState(false)
  
  if (imageError) {
    const paddingClass = size === "small" ? "p-4" : "p-6"
    const fontSizeClass = size === "small" ? "text-4xl" : "text-8xl"
    const labelSizeClass = size === "small" ? "text-sm mb-1" : "text-lg mb-2"
    const minWidthClass = size === "small" ? "min-w-[150px]" : "min-w-[200px]"
    
    return (
      <div className={`bg-castle-blue-light border-4 border-sky-blue rounded-lg ${paddingClass} text-center ${minWidthClass}`}>
        <div className={`text-sky-blue font-bold ${labelSizeClass}`}>ESTACIÓN</div>
        <div className={`text-white font-bold ${fontSizeClass}`}>{stationId}</div>
      </div>
    )
  }
  
  if (stationId > '4') {
    return <Navigate to="/stations" replace />
  }
  
  return (
    <img 
      src={`/Estaciones-${stationId}.png`}
      alt={`Estación ${stationId}`}
      className={className}
      onError={() => setImageError(true)}
    />
  )
}

export default StationImage

