import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import api from '../../services/api'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const DirectorDashboard = () => {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [isAllowed, setIsAllowed] = useState(false)
  const [stats, setStats] = useState(null)
  const [questionsStats, setQuestionsStats] = useState([])
  const [speakersStats, setSpeakersStats] = useState([])
  const [topUsers, setTopUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Verificar acceso: permitir a director y staff
  // Nota: La verificación de roles ya se hace en ProtectedRoute, aquí solo verificamos que el usuario esté cargado
  useEffect(() => {
    // Esperar a que la autenticación termine de cargar
    if (authLoading) return
    
    if (user) {
      if (user.rol === 'director' || user.rol === 'staff') {
        setIsAllowed(true)
      } else {
        // Si el usuario no tiene el rol correcto, redirigir
        navigate('/')
      }
    }
    // Si no hay usuario, ProtectedRoute ya maneja la redirección
  }, [user, authLoading, navigate])

  useEffect(() => {
    // Solo cargar datos si el usuario está permitido
    if (isAllowed) {
      fetchDashboardData()
      const interval = setInterval(fetchDashboardData, 30000) // Actualizar cada 30 segundos
      return () => clearInterval(interval)
    }
  }, [isAllowed])

  const fetchDashboardData = async () => {
    try {
      setError(null)
      setLoading(true)
      
      console.log('Iniciando carga de datos del dashboard...')
      console.log('Usuario actual:', user)
      console.log('Token disponible:', !!localStorage.getItem('token'))
      
      const [statsRes, questionsRes, speakersRes, topUsersRes] = await Promise.all([
        api.get('/dashboard/stats').catch(err => {
          console.error('Error en /dashboard/stats:', err)
          throw err
        }),
        api.get('/dashboard/questions-stats').catch(err => {
          console.error('Error en /dashboard/questions-stats:', err)
          throw err
        }),
        api.get('/dashboard/speakers-stats').catch(err => {
          console.error('Error en /dashboard/speakers-stats:', err)
          throw err
        }),
        api.get('/dashboard/top-users').catch(err => {
          console.error('Error en /dashboard/top-users:', err)
          throw err
        })
      ])
      
      console.log('Respuestas recibidas:', {
        stats: statsRes?.data,
        questions: questionsRes?.data,
        speakers: speakersRes?.data,
        topUsers: topUsersRes?.data
      })
      
      setStats(statsRes?.data || null)
      setQuestionsStats(Array.isArray(questionsRes?.data) ? questionsRes.data : [])
      setSpeakersStats(Array.isArray(speakersRes?.data) ? speakersRes.data : [])
      setTopUsers(Array.isArray(topUsersRes?.data) ? topUsersRes.data : [])
      
      console.log('Dashboard datos cargados exitosamente:', {
        stats: statsRes?.data,
        questionsCount: Array.isArray(questionsRes?.data) ? questionsRes.data.length : 0,
        speakersCount: Array.isArray(speakersRes?.data) ? speakersRes.data.length : 0,
        topUsersCount: Array.isArray(topUsersRes?.data) ? topUsersRes.data.length : 0
      })
    } catch (error) {
      console.error('Error completo al cargar datos del dashboard:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        config: error.config
      })
      
      setError({
        message: error.response?.data?.message || error.message || 'Error al cargar los datos del dashboard',
        status: error.response?.status,
        statusText: error.response?.statusText,
        details: error.message
      })
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
        head: [['Posición', 'Nombre', 'Puntuación', 'Tiempo Promedio (s)']],
        body: topUsers.map((user, index) => [
          index + 1, 
          user.nombre, 
          (Number(user.puntuacion) || 0).toFixed(2),
          (Number(user.tiempoPromedio) || 0).toFixed(1)
        ]),
      })
    }

    // Estadísticas por pregunta
    if (questionsStats.length > 0) {
      let startY = topUsers.length > 0 ? 120 : 80
      doc.setFontSize(14)
      doc.text('Estadísticas Detalladas por Pregunta', 14, startY)
      doc.autoTable({
        startY: startY + 5,
        head: [['ID', 'Pregunta', 'Correctas', 'Incorrectas', 'Total', '% Acierto']],
        body: questionsStats.map(stat => {
          const total = stat.correctas + stat.incorrectas
          const porcentaje = total > 0 ? ((stat.correctas / total) * 100).toFixed(2) : 0
          return [
            stat.id,
            (stat.pregunta || 'Sin pregunta').substring(0, 40) + ((stat.pregunta?.length || 0) > 40 ? '...' : ''),
            stat.correctas,
            stat.incorrectas,
            total,
            porcentaje + '%'
          ]
        }),
      })
    }

    doc.save(`reporte-armaduras-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const COLORS = ['#FF8C00', '#66C2E0', '#1A4B9F', '#FFA500']

  // Mostrar loading mientras se carga la autenticación o los datos
  if (authLoading || (loading && !error)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Cargando dashboard...</div>
      </div>
    )
  }

  // Si no está permitido después de cargar, mostrar mensaje (aunque ProtectedRoute ya debería haber redirigido)
  if (!isAllowed && !authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Acceso denegado. Solo disponible para directores y staff.</div>
      </div>
    )
  }

  // Mostrar error si hay algún problema
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-6 max-w-2xl">
          <h2 className="text-white text-2xl font-bold mb-4">Error al cargar el dashboard</h2>
          <p className="text-white mb-2">{(error.message || 'Error desconocido')}</p>
          {error.status && (
            <p className="text-white text-sm opacity-80 mb-4">Código de error: {error.status}</p>
          )}
          {error.status === 401 && (
            <p className="text-white text-sm mb-4">
              No tienes autorización para acceder. Verifica que tu sesión sea válida y que tengas el rol correcto.
            </p>
          )}
          {error.status === 403 && (
            <p className="text-white text-sm mb-4">
              Acceso denegado. Solo los usuarios con rol 'director' o 'staff' pueden acceder a este dashboard.
            </p>
          )}
          <button
            onClick={() => {
              setError(null)
              setLoading(true)
              fetchDashboardData()
            }}
            className="bg-gold-orange text-white px-6 py-2 rounded-lg hover:bg-opacity-90 mt-4"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-white text-4xl font-bold">Dashboard de Calificaciones</h1>
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
        {stats ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white bg-opacity-10 rounded-lg p-6">
              <h3 className="text-white text-lg font-bold mb-2">Usuarios Registrados</h3>
              <p className="text-white text-4xl font-bold">{stats.totalUsuarios || 0}</p>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-6">
              <h3 className="text-white text-lg font-bold mb-2">Usuarios Completados</h3>
              <p className="text-white text-4xl font-bold">{stats.usuariosCompletados || 0}</p>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-6">
              <h3 className="text-white text-lg font-bold mb-2">% Completación</h3>
              <p className="text-white text-4xl font-bold">{(stats.porcentajeCompletacion || 0).toFixed(2)}%</p>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-500 bg-opacity-20 border border-yellow-500 rounded-lg p-4 mb-8">
            <p className="text-white">No hay estadísticas disponibles aún.</p>
          </div>
        )}

        {/* Calificación por Pregunta - Informe Gráfico Detallado */}
        {questionsStats.length > 0 ? (
          <div className="bg-white bg-opacity-10 rounded-lg p-6 mb-8">
            <h2 className="text-white text-2xl font-bold mb-4">Informe Detallado de Preguntas</h2>
            <div className="mb-4 text-white text-sm opacity-80">
              Análisis completo de respuestas correctas e incorrectas por cada pregunta
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={questionsStats} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.1} />
                <XAxis 
                  dataKey="pregunta" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fill: '#ffffff', fontSize: 12 }}
                />
                <YAxis tick={{ fill: '#ffffff' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                    border: '1px solid #ffffff',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                />
                <Legend wrapperStyle={{ color: '#ffffff' }} />
                <Bar dataKey="correctas" fill="#66C2E0" name="Respuestas Correctas" />
                <Bar dataKey="incorrectas" fill="#FF8C00" name="Respuestas Incorrectas" />
              </BarChart>
            </ResponsiveContainer>
            
            {/* Tabla detallada de preguntas */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-white text-sm">
                <thead>
                  <tr className="border-b border-white border-opacity-30">
                    <th className="text-left py-3 px-4">ID</th>
                    <th className="text-left py-3 px-4">Pregunta</th>
                    <th className="text-center py-3 px-4">Correctas</th>
                    <th className="text-center py-3 px-4">Incorrectas</th>
                    <th className="text-center py-3 px-4">Total</th>
                    <th className="text-center py-3 px-4">% Acierto</th>
                  </tr>
                </thead>
                <tbody>
                  {questionsStats.map((stat) => {
                    const total = stat.correctas + stat.incorrectas
                    const porcentaje = total > 0 ? ((stat.correctas / total) * 100).toFixed(2) : 0
                    return (
                      <tr key={stat.id} className="border-b border-white border-opacity-10 hover:bg-white hover:bg-opacity-5">
                        <td className="py-3 px-4">{stat.id || '-'}</td>
                        <td className="py-3 px-4">{(stat.pregunta || 'Sin pregunta').substring(0, 60)}{(stat.pregunta?.length || 0) > 60 ? '...' : ''}</td>
                        <td className="text-center py-3 px-4 text-green-400 font-semibold">{stat.correctas || 0}</td>
                        <td className="text-center py-3 px-4 text-red-400 font-semibold">{stat.incorrectas || 0}</td>
                        <td className="text-center py-3 px-4">{total}</td>
                        <td className="text-center py-3 px-4">
                          <span className={`font-bold ${parseFloat(porcentaje) >= 70 ? 'text-green-400' : parseFloat(porcentaje) >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {porcentaje}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white bg-opacity-10 rounded-lg p-6 mb-8">
            <h2 className="text-white text-2xl font-bold mb-4">Informe Detallado de Preguntas</h2>
            <p className="text-white opacity-80">No hay datos de preguntas disponibles aún.</p>
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
                  <div className="text-right">
                    <div className="text-white font-bold text-xl">
                      {(Number(user.puntuacion) || 0).toFixed(2)} pts
                    </div>
                    <div className="text-white text-sm text-opacity-70 mt-1">
                      ⏱️ {(Number(user.tiempoPromedio) || 0).toFixed(1)}s promedio
                    </div>
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

