import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import QRCodeModal from './QRCodeModal'
import { useState } from 'react'

const Layout = ({ children }) => {
  const [qrUrl, setQrUrl] = useState('')

  const handleQRClick = () => {
    setQrUrl(window.location.href)
  }

  const handleCloseQR = () => {
    setQrUrl('')
  }

  return (
    <div className="min-h-screen relative">
      {/* Contenido principal */}
      <div className="relative">
        <Header />
        <main className="pb-20">
          {children || <Outlet />}
        </main>
        <Footer onQRClick={handleQRClick} />
      </div>

      <QRCodeModal url={qrUrl} onClose={handleCloseQR} />
    </div>
  )
}

export default Layout
