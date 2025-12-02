import express from 'express'
import getPool from '../config/database.js'

const router = express.Router()

// Obtener configuración de un evento
router.get('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params
    const pool = getPool()

    const [settings] = await pool.execute(
      'SELECT * FROM event_settings WHERE eventId = ?',
      [eventId]
    )

    if (settings.length === 0) {
      return res.status(404).json({ message: 'Configuración no encontrada' })
    }

    res.json(settings[0])
  } catch (error) {
    console.error('Error al obtener la configuración:', error)
    res.status(500).json({ message: 'Error del servidor' })
  }
})

// Actualizar configuración de un evento
router.put('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params
    const { bodyBackground, buttonText, resourcesLink } = req.body
    const pool = getPool()

    // Verificar si la configuración ya existe
    const [existingSettings] = await pool.execute(
      'SELECT * FROM event_settings WHERE eventId = ?',
      [eventId]
    )

    if (existingSettings.length > 0) {
      // Actualizar configuración existente
      await pool.execute(
        'UPDATE event_settings SET bodyBackground = ?, buttonText = ?, resourcesLink = ? WHERE eventId = ?',
        [bodyBackground, buttonText, resourcesLink, eventId]
      )
    } else {
      // Insertar nueva configuración
      await pool.execute(
        'INSERT INTO event_settings (eventId, bodyBackground, buttonText, resourcesLink) VALUES (?, ?, ?, ?)',
        [eventId, bodyBackground, buttonText, resourcesLink]
      )
    }

    res.json({ message: 'Configuración actualizada correctamente' })
  } catch (error) {
    console.error('Error al actualizar la configuración:', error)
    res.status(500).json({ message: 'Error del servidor' })
  }
})

export default router
