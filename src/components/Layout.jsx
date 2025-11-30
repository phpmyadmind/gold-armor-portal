import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import QRCodeModal from './QRCodeModal'
import { useState } from 'react'

const Layout = ({ children }) => {
  const [showQR, setShowQR] = useState(false)

  return (
    <div className="min-h-screen relative">
      {/* Contenido principal */}
      <div className="relative">
        <Header />
        <main className="pb-20">
          {children || <Outlet />}
        </main>
        <Footer onQRClick={() => setShowQR(true)} />
      </div>


      <QRCodeModal isOpen={showQR} onClose={() => setShowQR(false)} />
    </div>
  )
}

export default Layout

