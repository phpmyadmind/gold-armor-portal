import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import api from '../../services/api'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const DirectorDashboard = () => {
  const [stats, setStats] = useState(null)
  const [questionsStats, setQuestionsStats] = useState([])
  const [speakersStats, setSpeakersStats] = useState([])
  const [topUsers, setTopUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000) // Actualizar cada 30 segundos
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, questionsRes, speakersRes, topUsersRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/questions-stats'),
        api.get('/dashboard/speakers-stats'),
        api.get('/dashboard/top-users')
      ])
      
      setStats(statsRes.data)
      setQuestionsStats(questionsRes.data)
      setSpeakersStats(speakersRes.data)
      setTopUsers(topUsersRes.data)
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadExcel = async () => {
    try {
      const response = await api.get('/dashboard/export/excel', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `reporte-armaduras-${new Date().toISOString().split('T')[0]}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error al descargar Excel:', error)
      alert('Error al descargar el archivo Excel')
    }
  }

  const handleDownloadPDF = () => {
    const doc = new jsPDF()
    
    doc.setFontSize(20)
    doc.text('Reporte de Resultados - Armaduras de Oro', 14, 20)
    
    // Estadísticas generales
    if (stats) {
      doc.setFontSize(14)
      doc.text('Estadísticas Generales', 14, 35)
      doc.setFontSize(10)
      doc.text(`Usuarios Registrados: ${stats.totalUsuarios}`, 14, 45)
      doc.text(`Usuarios Completados: ${stats.usuariosCompletados}`, 14, 52)
      doc.text(`Porcentaje de Completación: ${stats.porcentajeCompletacion.toFixed(2)}%`, 14, 59)
    }

    // Top 5 usuarios
    if (topUsers.length > 0) {
      doc.setFontSize(14)
      doc.text('Top 5 Usuarios', 14, 75)
      doc.autoTable({
        startY: 80,
        head: [['Posición', 'Nombre', 'Puntuación']],
        body: topUsers.map((user, index) => [index + 1, user.nombre, user.puntuacion.toFixed(2)]),
      })
    }

    doc.save(`reporte-armaduras-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const COLORS = ['#FF8C00', '#66C2E0', '#1A4B9F', '#FFA500']

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Cargando dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-white text-4xl font-bold">Dashboard de Director</h1>
          <div className="flex gap-4">
            <button
              onClick={handleDownloadExcel}
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-opacity-90"
            >
              📥 Descargar Excel
            </button>
            <button
              onClick={handleDownloadPDF}
              className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-opacity-90"
            >
              📄 Descargar PDF
            </button>
          </div>
        </div>

        {/* Estadísticas en tiempo real */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white bg-opacity-10 rounded-lg p-6">
              <h3 className="text-white text-lg font-bold mb-2">Usuarios Registrados</h3>
              <p className="text-white text-4xl font-bold">{stats.totalUsuarios}</p>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-6">
              <h3 className="text-white text-lg font-bold mb-2">Usuarios Completados</h3>
              <p className="text-white text-4xl font-bold">{stats.usuariosCompletados}</p>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-6">
              <h3 className="text-white text-lg font-bold mb-2">% Completación</h3>
              <p className="text-white text-4xl font-bold">{stats.porcentajeCompletacion.toFixed(2)}%</p>
            </div>
          </div>
        )}

        {/* Calificación por Pregunta */}
        {questionsStats.length > 0 && (
          <div className="bg-white bg-opacity-10 rounded-lg p-6 mb-8">
            <h2 className="text-white text-2xl font-bold mb-4">Calificación por Pregunta</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={questionsStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="pregunta" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="correctas" fill="#66C2E0" name="Correctas" />
                <Bar dataKey="incorrectas" fill="#FF8C00" name="Incorrectas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Calificación por Speaker */}
        {speakersStats.length > 0 && (
          <div className="bg-white bg-opacity-10 rounded-lg p-6 mb-8">
            <h2 className="text-white text-2xl font-bold mb-4">Calificación por Speaker</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={speakersStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="speaker" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="promedio" fill="#1A4B9F" name="Puntuación Promedio" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Podio de Ganadores */}
        {topUsers.length > 0 && (
          <div className="bg-white bg-opacity-10 rounded-lg p-6 mb-8">
            <h2 className="text-white text-2xl font-bold mb-4">Podio de Ganadores (Top 5)</h2>
            <div className="space-y-3">
              {topUsers.map((user, index) => (
                <div key={user.id} className="flex items-center justify-between bg-white bg-opacity-5 rounded-lg p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-600' :
                      'bg-castle-blue-light'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-white font-bold">{user.nombre}</p>
                      <p className="text-white text-sm text-opacity-60">{user.ciudad}</p>
                    </div>
                  </div>
                  <div className="text-white font-bold text-xl">
                    {user.puntuacion.toFixed(2)} pts
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DirectorDashboard

