import express from 'express'
import getPool from '../config/database.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import { resolveUrls, resolveUrlsInArray } from '../utils/urlHelper.js'

const router = express.Router()

// Obtener todas las estaciones
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool()
    const [stations] = await pool.execute(
      'SELECT id, nombre, orden, problema, videoUrl, descripcion, headerText FROM stations ORDER BY orden ASC'
    )
    
    // Si no hay estaciones, crear las 4 por defecto
    if (stations.length === 0) {
      const defaultStations = [
        { nombre: 'Estación 1', orden: 1, headerText: 'ARMADURAS DE ORO' },
        { nombre: 'Estación 2', orden: 2, headerText: 'ARMADURAS DE ORO' },
        { nombre: 'Estación 3', orden: 3, headerText: 'ARMADURAS DE ORO' },
        { nombre: 'Estación 4', orden: 4, headerText: 'ARMADURAS DE ORO' }
      ]
      
      for (const station of defaultStations) {
        await pool.execute(
          'INSERT INTO stations (nombre, orden, headerText) VALUES (?, ?, ?)',
          [station.nombre, station.orden, station.headerText]
        )
      }
      
      const [newStations] = await pool.execute(
        'SELECT id, nombre, orden, problema, videoUrl, descripcion, headerText FROM stations ORDER BY orden ASC'
      )
      // Resolver URLs relativas a completas
      const resolvedStations = resolveUrlsInArray(newStations, ['videoUrl'])
      return res.json(resolvedStations)
    }
    
    // Resolver URLs relativas a completas
    const resolvedStations = resolveUrlsInArray(stations, ['videoUrl'])
    res.json(resolvedStations)
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
      'SELECT id, nombre, orden, problema, videoUrl, descripcion, headerText FROM stations WHERE id = ?',
      [id]
    )
    
    if (stations.length === 0) {
      return res.status(404).json({ message: 'Estación no encontrada' })
    }
    
    // Resolver URLs relativas a completas
    const resolvedStation = resolveUrls(stations[0], ['videoUrl'])
    res.json(resolvedStation)
  } catch (error) {
    console.error('Error al obtener estación:', error)
    res.status(500).json({ message: 'Error al obtener estación' })
  }
})

export default router

