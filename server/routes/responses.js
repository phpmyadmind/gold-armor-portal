import express from 'express'
import getPool from '../config/database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Crear respuestas en lote
router.post('/batch', authenticateToken, async (req, res) => {
  try {
    const pool = getPool()
    const { responses } = req.body
    const userData = req.user

    for (const response of responses) {
      await pool.execute(
        `INSERT INTO responses (userId, eventoId, questionId, estacionId, respuestaSeleccionada, esCorrecta, tiempoRespuesta, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         respuestaSeleccionada = VALUES(respuestaSeleccionada),
         esCorrecta = VALUES(esCorrecta),
         tiempoRespuesta = VALUES(tiempoRespuesta),
         estado = VALUES(estado)`,
        [
          response.userId || userData.id,
          response.eventoId,
          response.questionId,
          response.estacionId,
          JSON.stringify(response.respuestaSeleccionada),
          response.esCorrecta ? 1 : 0,
          response.tiempoRespuesta,
          response.estado || 'completado'
        ]
      )
    }

    res.json({ message: 'Respuestas guardadas' })
  } catch (error) {
    console.error('Error al guardar respuestas:', error)
    res.status(500).json({ message: 'Error al guardar respuestas' })
  }
})

// Verificar si el usuario completó una estación
router.get('/station/:stationId/completed', authenticateToken, async (req, res) => {
  try {
    const pool = getPool()
    const { stationId } = req.params
    const userData = req.user

    const [responses] = await pool.execute(
      'SELECT COUNT(*) as count FROM responses WHERE userId = ? AND estacionId = ? AND estado = "completado"',
      [userData.id, stationId]
    )

    const [questions] = await pool.execute(
      'SELECT COUNT(*) as total FROM questions WHERE estacionId = ?',
      [stationId]
    )

    const completed = responses[0].count === questions[0].total
    res.json({ completed })
  } catch (error) {
    console.error('Error al verificar completitud:', error)
    res.status(500).json({ message: 'Error al verificar completitud' })
  }
})

export default router

