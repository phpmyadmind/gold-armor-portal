import express from 'express'
import getPool from '../config/database.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import * as XLSX from 'xlsx'

const router = express.Router()

// Todas las rutas del dashboard requieren autenticación y rol director o staff
router.use(authenticateToken)
router.use(requireRole('director', 'staff'))

// Estadísticas generales
router.get('/stats', async (req, res) => {
  try {
    const pool = getPool()
    const [totalUsers] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE rol = "usuario"')
    const [completedUsers] = await pool.execute(`
      SELECT COUNT(DISTINCT userId) as count 
      FROM responses 
      WHERE estado = "completado"
    `)
    
    const totalUsuarios = totalUsers[0].count
    const usuariosCompletados = completedUsers[0].count
    const porcentajeCompletacion = totalUsuarios > 0 
      ? (usuariosCompletados / totalUsuarios) * 100 
      : 0

    res.json({
      totalUsuarios,
      usuariosCompletados,
      porcentajeCompletacion
    })
  } catch (error) {
    console.error('Error al obtener estadísticas:', error)
    res.status(500).json({ message: 'Error al obtener estadísticas' })
  }
})

// Estadísticas por pregunta
router.get('/questions-stats', async (req, res) => {
  try {
    const pool = getPool()
    const [stats] = await pool.execute(`
      SELECT 
        q.id,
        SUBSTRING(q.texto, 1, 50) as pregunta,
        SUM(CASE WHEN r.esCorrecta = 1 THEN 1 ELSE 0 END) as correctas,
        SUM(CASE WHEN r.esCorrecta = 0 THEN 1 ELSE 0 END) as incorrectas
      FROM questions q
      LEFT JOIN responses r ON q.id = r.questionId
      GROUP BY q.id, q.texto
      ORDER BY q.estacionId, q.id
    `)
    
    res.json(stats)
  } catch (error) {
    console.error('Error al obtener estadísticas de preguntas:', error)
    res.status(500).json({ message: 'Error al obtener estadísticas de preguntas' })
  }
})

// Estadísticas por speaker
router.get('/speakers-stats', async (req, res) => {
  try {
    const pool = getPool()
    const [stats] = await pool.execute(`
      SELECT 
        u.nombre as speaker,
        AVG(CASE WHEN r.esCorrecta = 1 THEN 1.0 ELSE 0.0 END) * 100 as promedio
      FROM questions q
      INNER JOIN users u ON q.speakerId = u.id
      LEFT JOIN responses r ON q.id = r.questionId
      GROUP BY u.id, u.nombre
      ORDER BY promedio DESC
    `)
    
    res.json(stats)
  } catch (error) {
    console.error('Error al obtener estadísticas de speakers:', error)
    res.status(500).json({ message: 'Error al obtener estadísticas de speakers' })
  }
})

// Top usuarios
router.get('/top-users', async (req, res) => {
  try {
    const pool = getPool()
    const [topUsers] = await pool.execute(`
      SELECT 
        u.id,
        u.nombre,
        u.ciudad,
        COUNT(CASE WHEN r.esCorrecta = 1 THEN 1 END) * 100.0 / COUNT(r.id) as puntuacion
      FROM users u
      LEFT JOIN responses r ON u.id = r.userId AND r.estado = "completado"
      WHERE u.rol = "usuario"
      GROUP BY u.id, u.nombre, u.ciudad
      HAVING COUNT(r.id) > 0
      ORDER BY puntuacion DESC
      LIMIT 5
    `)
    
    res.json(topUsers)
  } catch (error) {
    console.error('Error al obtener top usuarios:', error)
    res.status(500).json({ message: 'Error al obtener top usuarios' })
  }
})

// Exportar a Excel
router.get('/export/excel', async (req, res) => {
  try {
    const pool = getPool()
    const [data] = await pool.execute(`
      SELECT 
        u.nombre as Usuario,
        u.identificacion as Identificacion,
        u.ciudad as Ciudad,
        e.nombre as Evento,
        s.nombre as Estacion,
        q.texto as Pregunta,
        r.respuestaSeleccionada as Respuesta,
        CASE WHEN r.esCorrecta = 1 THEN 'Correcta' ELSE 'Incorrecta' END as Resultado,
        r.tiempoRespuesta as 'Tiempo (segundos)',
        r.createdAt as Fecha
      FROM responses r
      INNER JOIN users u ON r.userId = u.id
      LEFT JOIN events e ON r.eventoId = e.id
      LEFT JOIN stations s ON r.estacionId = s.id
      LEFT JOIN questions q ON r.questionId = q.id
      ORDER BY r.createdAt DESC
    `)
    
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Respuestas')
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename=reporte-${new Date().toISOString().split('T')[0]}.xlsx`)
    res.send(buffer)
  } catch (error) {
    console.error('Error al exportar Excel:', error)
    res.status(500).json({ message: 'Error al exportar Excel' })
  }
})

export default router

