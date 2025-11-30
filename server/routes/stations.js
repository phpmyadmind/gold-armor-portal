import express from 'express'
import getPool from '../config/database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Obtener todas las estaciones
router.get('/', authenticateToken, async (req, res) => {
  try {
    const pool = getPool()
    const [stations] = await pool.execute(
      'SELECT * FROM stations ORDER BY orden ASC'
    )
    
    // Si no hay estaciones, crear las 4 por defecto
    if (stations.length === 0) {
      const defaultStations = [
        { nombre: 'Estación 1', orden: 1 },
        { nombre: 'Estación 2', orden: 2 },
        { nombre: 'Estación 3', orden: 3 },
        { nombre: 'Estación 4', orden: 4 }
      ]
      
      for (const station of defaultStations) {
        await pool.execute(
          'INSERT INTO stations (nombre, orden) VALUES (?, ?)',
          [station.nombre, station.orden]
        )
      }
      
      const [newStations] = await pool.execute(
        'SELECT * FROM stations ORDER BY orden ASC'
      )
      return res.json(newStations)
    }
    
    res.json(stations)
  } catch (error) {
    console.error('Error al obtener estaciones:', error)
    res.status(500).json({ message: 'Error al obtener estaciones' })
  }
})

// Obtener estación por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const pool = getPool()
    const { id } = req.params
    const [stations] = await pool.execute(
      'SELECT * FROM stations WHERE id = ?',
      [id]
    )
    
    if (stations.length === 0) {
      return res.status(404).json({ message: 'Estación no encontrada' })
    }
    
    res.json(stations[0])
  } catch (error) {
    console.error('Error al obtener estación:', error)
    res.status(500).json({ message: 'Error al obtener estación' })
  }
})

export default router

