import express from 'express'
import bcrypt from 'bcryptjs'
import getPool from '../config/database.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'

const router = express.Router()

// Obtener todos los usuarios
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool()
    const { rol } = req.query
    let query = 'SELECT id, identificacion, nombre, ciudad, email, rol, eventoId FROM users'
    const params = []
    
    if (rol) {
      query += ' WHERE rol = ?'
      params.push(rol)
    }
    
    const [users] = await pool.execute(query, params)
    res.json(users)
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    res.status(500).json({ message: 'Error al obtener usuarios' })
  }
})

// Crear usuario
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool()
    const { identificacion, nombre, ciudad, email, password, rol } = req.body

    const hashedPassword = await bcrypt.hash(password, 10)

    // Obtener evento activo
    const [events] = await pool.execute(
      'SELECT id FROM events WHERE activo = 1 LIMIT 1'
    )
    const eventoId = events.length > 0 ? events[0].id : null

    const [result] = await pool.execute(
      'INSERT INTO users (identificacion, nombre, ciudad, email, password, rol, eventoId) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [identificacion, nombre, ciudad || null, email, hashedPassword, rol, eventoId]
    )

    const [newUser] = await pool.execute(
      'SELECT id, identificacion, nombre, ciudad, email, rol, eventoId FROM users WHERE id = ?',
      [result.insertId]
    )

    res.json(newUser[0])
  } catch (error) {
    console.error('Error al crear usuario:', error)
    res.status(500).json({ message: 'Error al crear usuario' })
  }
})

// Eliminar usuario
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool()
    const { id } = req.params
    await pool.execute('DELETE FROM users WHERE id = ?', [id])
    res.json({ message: 'Usuario eliminado' })
  } catch (error) {
    console.error('Error al eliminar usuario:', error)
    res.status(500).json({ message: 'Error al eliminar usuario' })
  }
})

export default router

