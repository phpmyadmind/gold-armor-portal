import { Link } from 'react-router-dom'

const AdminDashboard = () => {
  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-white text-4xl font-bold mb-8">Panel de Administración</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/admin/events"
            className="bg-white bg-opacity-10 hover:bg-opacity-20 rounded-lg p-6 text-white transition-all transform hover:scale-105"
          >
            <h2 className="text-2xl font-bold mb-2">📅 Gestión de Eventos</h2>
            <p>Crear, editar y activar eventos</p>
          </Link>

          <Link
            to="/admin/users"
            className="bg-white bg-opacity-10 hover:bg-opacity-20 rounded-lg p-6 text-white transition-all transform hover:scale-105"
          >
            <h2 className="text-2xl font-bold mb-2">👥 Gestión de Usuarios</h2>
            <p>Registrar y administrar usuarios</p>
          </Link>

          <Link
            to="/admin/trivias"
            className="bg-white bg-opacity-10 hover:bg-opacity-20 rounded-lg p-6 text-white transition-all transform hover:scale-105"
          >
            <h2 className="text-2xl font-bold mb-2">❓ Gestión de Trivias</h2>
            <p>Crear y editar preguntas</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard

