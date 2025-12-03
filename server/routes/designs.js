import express from 'express';
import getPool from '../config/database.js';
import upload from '../middleware/uploadMiddleware.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
const pool = getPool();
const isAdmin = (req, res, next) => requireRole('admin')(req, res, next);

// --- RUTAS DE DISEÑO DE EVENTOS ---

const eventDesignFields = `
  eventoId, bodyBgColor, bodyBgImage, headerLogo, pageLogo, fontFile,
  buttonBgColor, buttonTextColor, buttonHoverBgColor, buttonHoverTextColor, buttonBorderRadius
`;

// Obtener el diseño del evento activo
router.get('/event/active', async (req, res) => {
  try {
    // 1. Encontrar el evento activo
    const [activeEvents] = await pool.execute('SELECT id FROM events WHERE activo = 1 LIMIT 1');
    if (activeEvents.length === 0) {
      return res.status(404).json({ message: 'No hay un evento activo actualmente.' });
    }
    const activeEventId = activeEvents[0].id;

    // 2. Obtener el diseño de ese evento
    const query = `SELECT ${eventDesignFields} FROM event_designs WHERE eventoId = ?`;
    const [designs] = await pool.execute(query, [activeEventId]);
    
    if (designs.length > 0) {
      res.json(designs[0]);
    } else {
      // Si no hay diseño específico, devolver un objeto vacío para que el frontend use valores por defecto
      res.json({});
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el diseño del evento activo', details: error.message });
  }
});

router.get('/event/:eventId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const query = `SELECT ${eventDesignFields} FROM event_designs WHERE eventoId = ?`;
    const [designs] = await pool.execute(query, [req.params.eventId]);
    if (designs.length > 0) {
      res.json(designs[0]);
    } else {
      res.status(404).json({ message: 'No se encontró un diseño para este evento.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el diseño', details: error.message });
  }
});

router.put('/event/:eventId', authenticateToken, isAdmin, upload.fields([
  { name: 'bodyBgImage', maxCount: 1 }, { name: 'headerLogo', maxCount: 1 },
  { name: 'pageLogo', maxCount: 1 }, { name: 'fontFile', maxCount: 1 },
]), async (req, res) => {
  const { eventId } = req.params;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const relativePath = (file) => file ? `/uploads/${eventId}/${file.filename}` : undefined;

    const [existing] = await connection.execute('SELECT bodyBgImage, headerLogo, pageLogo, fontFile FROM event_designs WHERE eventoId = ?', [eventId]);

    const designData = {
      bodyBgColor: req.body.bodyBgColor,
      buttonBgColor: req.body.buttonBgColor,
      buttonTextColor: req.body.buttonTextColor,
      buttonHoverBgColor: req.body.buttonHoverBgColor,
      buttonHoverTextColor: req.body.buttonHoverTextColor,
      buttonBorderRadius: req.body.buttonBorderRadius,
      bodyBgImage: relativePath(req.files?.bodyBgImage?.[0]) || existing[0]?.bodyBgImage,
      headerLogo: relativePath(req.files?.headerLogo?.[0]) || existing[0]?.headerLogo,
      pageLogo: relativePath(req.files?.pageLogo?.[0]) || existing[0]?.pageLogo,
      fontFile: relativePath(req.files?.fontFile?.[0]) || existing[0]?.fontFile,
    };

    if (existing.length > 0) {
      await connection.execute('UPDATE event_designs SET ? WHERE eventoId = ?', [designData, eventId]);
    } else {
      designData.eventoId = eventId;
      await connection.execute('INSERT INTO event_designs SET ?', [designData]);
    }

    await connection.commit();
    res.json({ message: 'Diseño del evento actualizado' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Error al actualizar el diseño', details: error.message });
  } finally {
    connection.release();
  }
});

// --- RUTAS DE DISEÑO DE ESTACIONES ---

const stationDesignFields = `
  stationId, background_image, button_bg_color, button_text_color, 
  button_hover_bg_color, button_hover_text_color
`;

router.route('/station/:stationId')
  .all(authenticateToken, isAdmin)
  .get(async (req, res) => {
    try {
      const query = `SELECT ${stationDesignFields} FROM station_designs WHERE stationId = ?`;
      const [designs] = await pool.execute(query, [req.params.stationId]);
      res.json(designs[0] || {});
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener el diseño de la estación', details: error.message });
    }
  })
  .put(upload.single('backgroundImage'), async (req, res) => {
    const { stationId } = req.params;
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const relativePath = (file) => file ? `/uploads/stations/${stationId}/${file.filename}` : undefined;
      
      const [existing] = await connection.execute('SELECT background_image FROM station_designs WHERE stationId = ?', [stationId]);
      
      const designData = {
        background_image: relativePath(req.file) || existing[0]?.background_image,
        button_bg_color: req.body.button_bg_color,
        button_text_color: req.body.button_text_color,
        button_hover_bg_color: req.body.button_hover_bg_color,
        button_hover_text_color: req.body.button_hover_text_color,
      };

      if (existing.length > 0) {
        await connection.execute('UPDATE station_designs SET ? WHERE stationId = ?', [designData, stationId]);
      } else {
        designData.stationId = stationId;
        await connection.execute('INSERT INTO station_designs SET ?', [designData]);
      }
      
      await connection.commit();
      res.json({ message: 'Diseño de la estación actualizado' });
    } catch (error) {
      await connection.rollback();
      res.status(500).json({ message: 'Error al actualizar', details: error.message });
    } finally {
      connection.release();
    }
  });

export default router;
