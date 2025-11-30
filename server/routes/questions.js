import express from 'express'
import getPool from '../config/database.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'

const router = express.Router()

// Obtener todas las preguntas
router.get('/', authenticateToken, async (req, res) => {
  try {
    const pool = getPool()
    const [questions] = await pool.execute(
      'SELECT * FROM questions ORDER BY estacionId, id'
    )
    res.json(questions.map(q => ({
      ...q,
      opciones: JSON.parse(q.opciones || '[]'),
      respuestaCorrecta: JSON.parse(q.respuestaCorrecta || 'null')
    })))
  } catch (error) {
    console.error('Error al obtener preguntas:', error)
    res.status(500).json({ message: 'Error al obtener preguntas' })
  }
})

// Obtener preguntas por estación
router.get('/station/:stationId', authenticateToken, async (req, res) => {
  try {
    const pool = getPool()
    const { stationId } = req.params
    const [questions] = await pool.execute(
      'SELECT * FROM questions WHERE estacionId = ? ORDER BY id',
      [stationId]
    )
    res.json(questions.map(q => ({
      ...q,
      opciones: JSON.parse(q.opciones || '[]'),
      respuestaCorrecta: JSON.parse(q.respuestaCorrecta || 'null')
    })))
  } catch (error) {
    console.error('Error al obtener preguntas:', error)
    res.status(500).json({ message: 'Error al obtener preguntas' })
  }
})

// Obtener preguntas por speaker
router.get('/speaker/:speakerId', authenticateToken, async (req, res) => {
  try {
    const pool = getPool()
    const { speakerId } = req.params
    const [questions] = await pool.execute(
      'SELECT * FROM questions WHERE speakerId = ? ORDER BY estacionId, id',
      [speakerId]
    )
    res.json(questions.map(q => ({
      ...q,
      opciones: JSON.parse(q.opciones || '[]'),
      respuestaCorrecta: JSON.parse(q.respuestaCorrecta || 'null')
    })))
  } catch (error) {
    console.error('Error al obtener preguntas:', error)
    res.status(500).json({ message: 'Error al obtener preguntas' })
  }
})

// Crear pregunta
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool()
    const { texto, tipo, opciones, respuestaCorrecta, speakerId, estacionId, eventoId } = req.body
    
    const [result] = await pool.execute(
      'INSERT INTO questions (texto, tipo, opciones, respuestaCorrecta, speakerId, estacionId, eventoId) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        texto,
        tipo,
        JSON.stringify(opciones),
        JSON.stringify(respuestaCorrecta),
        speakerId || null,
        estacionId,
        eventoId
      ]
    )
    
    res.json({ id: result.insertId, texto, tipo, opciones, respuestaCorrecta })
  } catch (error) {
    console.error('Error al crear pregunta:', error)
    res.status(500).json({ message: 'Error al crear pregunta' })
  }
})

// Actualizar pregunta
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool()
    const { id } = req.params
    const { texto, tipo, opciones, respuestaCorrecta, speakerId, estacionId, eventoId } = req.body
    
    await pool.execute(
      'UPDATE questions SET texto = ?, tipo = ?, opciones = ?, respuestaCorrecta = ?, speakerId = ?, estacionId = ?, eventoId = ? WHERE id = ?',
      [
        texto,
        tipo,
        JSON.stringify(opciones),
        JSON.stringify(respuestaCorrecta),
        speakerId || null,
        estacionId,
        eventoId,
        id
      ]
    )
    
    res.json({ message: 'Pregunta actualizada' })
  } catch (error) {
    console.error('Error al actualizar pregunta:', error)
    res.status(500).json({ message: 'Error al actualizar pregunta' })
  }
})

// Eliminar pregunta
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool()
    const { id } = req.params
    await pool.execute('DELETE FROM questions WHERE id = ?', [id])
    res.json({ message: 'Pregunta eliminada' })
  } catch (error) {
    console.error('Error al eliminar pregunta:', error)
    res.status(500).json({ message: 'Error al eliminar pregunta' })
  }
})

export default router

