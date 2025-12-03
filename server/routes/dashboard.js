import express from 'express'
import getPool from '../config/database.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import * as XLSX from 'xlsx'

const router = express.Router()

// Middleware para verificar acceso de director o staff
const checkDirectorOrStaff = (req, res, next) => {
  authenticateToken(req, res, () => {
    requireRole('director', 'staff')(req, res, next)
  })
}

// Ruta: Estadísticas generales
router.get('/stats', checkDirectorOrStaff, async (req, res) => {
  try {
    const pool = getPool()
    const [totalUsers] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE rol = "usuario"')
    const [completedUsers] = await pool.execute(`
      SELECT COUNT(DISTINCT userId) as count FROM responses WHERE estado = "completado"
    `)
    
    const totalUsuarios = totalUsers[0].count
    const usuariosCompletados = completedUsers[0].count
    const porcentajeCompletacion = totalUsuarios > 0 ? (usuariosCompletados / totalUsuarios) * 100 : 0

    res.json({ totalUsuarios, usuariosCompletados, porcentajeCompletacion })
  } catch (error) {
    console.error('Error en /stats:', error)
    res.status(500).json({ message: 'Error al obtener estadísticas generales' })
  }
})

// Ruta: Estadísticas por pregunta
router.get('/questions-stats', checkDirectorOrStaff, async (req, res) => {
  try {
    const pool = getPool()
    const [stats] = await pool.execute(`
      SELECT 
        q.id, SUBSTRING(q.texto, 1, 50) as pregunta,
        SUM(CASE WHEN r.esCorrecta = 1 THEN 1 ELSE 0 END) as correctas,
        SUM(CASE WHEN r.esCorrecta = 0 THEN 1 ELSE 0 END) as incorrectas
      FROM questions q
      LEFT JOIN responses r ON q.id = r.questionId
      GROUP BY q.id, q.texto ORDER BY q.estacionId, q.id
    `)
    res.json(stats)
  } catch (error) {
    console.error('Error en /questions-stats:', error)
    res.status(500).json({ message: 'Error al obtener estadísticas de preguntas' })
  }
})

// Ruta: Estadísticas por speaker
router.get('/speakers-stats', checkDirectorOrStaff, async (req, res) => {
  try {
    const pool = getPool()
    const [stats] = await pool.execute(`
      SELECT u.nombre as speaker,
        AVG(CASE WHEN r.esCorrecta = 1 THEN 1.0 ELSE 0.0 END) * 100 as promedio
      FROM questions q
      JOIN users u ON q.speakerId = u.id
      LEFT JOIN responses r ON q.id = r.questionId
      GROUP BY u.id, u.nombre ORDER BY promedio DESC
    `)
    res.json(stats)
  } catch (error) {
    console.error('Error en /speakers-stats:', error)
    res.status(500).json({ message: 'Error al obtener estadísticas de speakers' })
  }
})

// Ruta: Top 5 usuarios (CORREGIDA)
router.get('/top-users', checkDirectorOrStaff, async (req, res) => {
  try {
    const pool = getPool()
    const [topUsers] = await pool.execute(`
      SELECT 
        u.id, u.nombre, u.ciudad,
        -- Puntuación: Porcentaje de respuestas correctas
        (SUM(r.esCorrecta) * 100.0 / COUNT(r.id)) as puntuacion,
        -- Tiempo Promedio: Promedio del tiempo de respuesta por pregunta
        AVG(r.tiempoRespuesta) as tiempoPromedio
      FROM users u
      -- Unir solo con respuestas a preguntas (ignorar marcadores de 'completado')
      JOIN responses r ON u.id = r.userId AND r.questionId IS NOT NULL
      WHERE u.rol = 'usuario'
      GROUP BY u.id, u.nombre, u.ciudad
      -- Ordenar por puntuación (desc) y luego por tiempo (asc) como desempate
      ORDER BY puntuacion DESC, tiempoPromedio ASC
      LIMIT 5
    `)
    
    const formattedUsers = topUsers.map(user => ({
      ...user,
      puntuacion: parseFloat(user.puntuacion) || 0,
      tiempoPromedio: parseFloat(user.tiempoPromedio) || 0
    }))
    
    res.json(formattedUsers)
  } catch (error) {
    console.error('Error al obtener top usuarios:', error)
    res.status(500).json({ message: 'Error al obtener top usuarios' })
  }
})

// Ruta: Exportar a Excel
router.get('/export/excel', checkDirectorOrStaff, async (req, res) => {
  try {
    const pool = getPool()
    const [data] = await pool.execute(`
      SELECT 
        u.nombre as Usuario, u.identificacion as Identificacion, u.ciudad as Ciudad,
        e.nombre as Evento, s.nombre as Estacion, q.texto as Pregunta,
        r.respuestaSeleccionada as Respuesta,
        CASE WHEN r.esCorrecta = 1 THEN 'Correcta' ELSE 'Incorrecta' END as Resultado,
        r.tiempoRespuesta as 'Tiempo (segundos)', r.createdAt as Fecha
      FROM responses r
      JOIN users u ON r.userId = u.id
      LEFT JOIN events e ON r.eventoId = e.id
      LEFT JOIN stations s ON r.estacionId = s.id
      LEFT JOIN questions q ON r.questionId = q.id
      WHERE r.questionId IS NOT NULL
      ORDER BY r.createdAt DESC
    `)
    
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Respuestas')
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename=reporte-armaduras-${new Date().toISOString().split('T')[0]}.xlsx`)
    res.send(buffer)
  } catch (error) {
    console.error('Error al exportar Excel:', error)
    res.status(500).json({ message: 'Error al exportar Excel' })
  }
})

export default router
