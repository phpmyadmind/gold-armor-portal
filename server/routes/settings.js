import express from 'express';
import getPool from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { resolveUrls } from '../utils/urlHelper.js';

const router = express.Router();

// Middleware para verificar los roles permitidos (admin o director)
const allowedRoles = requireRole('admin', 'director');

// --- Obtener la configuración de un evento ---
// Protegido: solo admin y director pueden ver la configuración.
router.get('/:eventId', authenticateToken, allowedRoles, async (req, res) => {
  try {
    const { eventId } = req.params;
    const pool = getPool();

    const [settings] = await pool.execute(
      'SELECT * FROM event_settings WHERE eventId = ?',
      [eventId]
    );

    if (settings.length === 0) {
      // Devolver una configuración por defecto si no existe para evitar errores en el cliente
      return res.json({
        eventId,
        bodyBackground: '#FFFFFF', // Un color de fondo neutro
        buttonText: 'Continuar',
        resourcesLink: null
      });
    }

    // Asegurar que la URL se resuelva correctamente
    const resolvedSettings = resolveUrls(settings[0], ['resourcesLink']);
    res.json(resolvedSettings);

  } catch (error) {
    console.error('Error al obtener la configuración del evento:', error);
    res.status(500).json({ message: 'Error interno al obtener la configuración.' });
  }
});

// --- Actualizar la configuración de un evento ---
// Protegido: solo admin y director pueden modificar la configuración.
router.put('/:eventId', authenticateToken, allowedRoles, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { bodyBackground, buttonText, resourcesLink } = req.body;
    const pool = getPool();

    // Usar INSERT ... ON DUPLICATE KEY UPDATE para una operación atómica y más limpia
    const query = `
      INSERT INTO event_settings (eventId, bodyBackground, buttonText, resourcesLink)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        bodyBackground = VALUES(bodyBackground),
        buttonText = VALUES(buttonText),
        resourcesLink = VALUES(resourcesLink);
    `;

    await pool.execute(query, [eventId, bodyBackground, buttonText, resourcesLink]);

    // Devolver la configuración actualizada
    const [updatedSettings] = await pool.execute(
        'SELECT * FROM event_settings WHERE eventId = ?',
        [eventId]
    );
    
    const resolvedSettings = resolveUrls(updatedSettings[0], ['resourcesLink']);
    res.json(resolvedSettings);

  } catch (error) {
    console.error('Error al actualizar la configuración del evento:', error);
    res.status(500).json({ message: 'Error interno al actualizar la configuración.' });
  }
});

export default router;
