import express from 'express'
import getPool from '../config/database.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'

const router = express.Router()

// Obtener todos los eventos
router.get('/', authenticateToken, async (req, res) => {
  try {
    const pool = getPool()
    const [events] = await pool.execute(
      'SELECT * FROM events ORDER BY fechaInicio DESC'
    )
    res.json(events)
  } catch (error) {
    console.error('Error al obtener eventos:', error)
    res.status(500).json({ message: 'Error al obtener eventos' })
  }
})

// Obtener evento activo
router.get('/active', async (req, res) => {
  try {
    const pool = getPool()
    const [events] = await pool.execute(
      'SELECT * FROM events WHERE activo = 1 LIMIT 1'
    )
    if (events.length > 0) {
      res.json(events[0])
    } else {
      res.json(null)
    }
  } catch (error) {
    console.error('Error al obtener evento activo:', error)
    res.status(500).json({ message: 'Error al obtener evento activo' })
  }
})

// Crear evento
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool()
    const { nombre, descripcion, fechaInicio, fechaFin } = req.body
    const [result] = await pool.execute(
      'INSERT INTO events (nombre, descripcion, fechaInicio, fechaFin, activo) VALUES (?, ?, ?, ?, 0)',
      [nombre, descripcion || null, fechaInicio || null, fechaFin || null]
    )
    res.json({ id: result.insertId, nombre, descripcion, fechaInicio, fechaFin, activo: 0 })
  } catch (error) {
    console.error('Error al crear evento:', error)
    res.status(500).json({ message: 'Error al crear evento' })
  }
})

// Actualizar evento
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool()
    const { id } = req.params
    const { nombre, descripcion, fechaInicio, fechaFin } = req.body
    await pool.execute(
      'UPDATE events SET nombre = ?, descripcion = ?, fechaInicio = ?, fechaFin = ? WHERE id = ?',
      [nombre, descripcion || null, fechaInicio || null, fechaFin || null, id]
    )
    res.json({ message: 'Evento actualizado' })
  } catch (error) {
    console.error('Error al actualizar evento:', error)
    res.status(500).json({ message: 'Error al actualizar evento' })
  }
})

// Toggle activo
router.put('/:id/toggle-active', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool()
    const { id } = req.params
    const { activo } = req.body

    // Si se activa un evento, desactivar todos los demás
    if (activo) {
      await pool.execute('UPDATE events SET activo = 0')
    }

    await pool.execute('UPDATE events SET activo = ? WHERE id = ?', [activo ? 1 : 0, id])
    res.json({ message: 'Estado actualizado' })
  } catch (error) {
    console.error('Error al cambiar estado:', error)
    res.status(500).json({ message: 'Error al cambiar estado' })
  }
})

// Eliminar evento
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool()
    const { id } = req.params
    await pool.execute('DELETE FROM events WHERE id = ?', [id])
    res.json({ message: 'Evento eliminado' })
  } catch (error) {
    console.error('Error al eliminar evento:', error)
    res.status(500).json({ message: 'Error al eliminar evento' })
  }
})

export default router

