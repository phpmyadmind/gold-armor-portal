import express from 'express';
import getPool from '../config/database.js';
import upload from '../middleware/uploadMiddleware.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
const pool = getPool();
const isAdmin = requireRole('admin');

// --- RUTAS DE DISEÑO DE EVENTOS ---

const eventDesignFields = `
  eventoId, bodyBgColor, bodyBgImage, headerLogo, pageLogo, fontFile,
  buttonBgColor, buttonTextColor, buttonHoverBgColor, buttonHoverTextColor, buttonBorderRadius,
  footerBgColor, footerBgImage, 
  authTitle, authSubtitle, loginTitle, registerTitle, authFlow,
  showName, showCompany, showPosition
`;

const eventUploads = upload.fields([
    { name: 'bodyBgImage', maxCount: 1 }, { name: 'headerLogo', maxCount: 1 },
    { name: 'pageLogo', maxCount: 1 }, { name: 'fontFile', maxCount: 1 },
    { name: 'footerBgImage', maxCount: 1 }
]);

router.get('/event/active', async (req, res) => {
  try {
    const [activeEvents] = await pool.execute('SELECT id FROM events WHERE activo = 1 LIMIT 1');
    if (activeEvents.length === 0) return res.status(404).json({ message: 'No hay un evento activo.' });
    const [[design]] = await pool.execute(`SELECT ${eventDesignFields} FROM event_designs WHERE eventoId = ?`, [activeEvents[0].id]);
    res.json(design || {});
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el diseño del evento', details: error.message });
  }
});

router.route('/event/:eventId')
  .all(authenticateToken, isAdmin)
  .get(async (req, res) => {
    try {
      const [[design]] = await pool.execute(`SELECT ${eventDesignFields} FROM event_designs WHERE eventoId = ?`, [req.params.eventId]);
      if (!design) return res.status(404).json({ message: 'No se encontró un diseño para este evento.' });
      res.json(design);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener el diseño', details: error.message });
    }
  })
  .put(eventUploads, async (req, res) => {
    const { eventId } = req.params;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      
      // FIX: Safely get the existing design without destructuring a potentially empty array
      const [existingRows] = await connection.execute('SELECT * FROM event_designs WHERE eventoId = ?', [eventId]);
      const existing = existingRows[0]; // This is now safe, existing is undefined if no design is found
      
      const relativePath = (file) => file ? `/uploads/${eventId}/${file.filename}` : undefined;

      const fileFields = {
        bodyBgImage: req.files?.bodyBgImage?.[0], headerLogo: req.files?.headerLogo?.[0],
        pageLogo: req.files?.pageLogo?.[0], fontFile: req.files?.fontFile?.[0],
        footerBgImage: req.files?.footerBgImage?.[0],
      };

      const designData = {};
      for (const [key, file] of Object.entries(fileFields)) {
        // If a new file is uploaded, use its path. Otherwise, keep the existing path.
        designData[key] = file ? relativePath(file) : existing?.[key];
      }

      Object.assign(designData, {
        bodyBgColor: req.body.bodyBgColor, buttonBgColor: req.body.buttonBgColor,
        buttonTextColor: req.body.buttonTextColor, buttonHoverBgColor: req.body.buttonHoverBgColor,
        buttonHoverTextColor: req.body.buttonHoverTextColor, buttonBorderRadius: req.body.buttonBorderRadius,
        footerBgColor: req.body.footerBgColor, authTitle: req.body.authTitle, authSubtitle: req.body.authSubtitle,
        loginTitle: req.body.loginTitle, registerTitle: req.body.registerTitle, authFlow: req.body.authFlow,
        showName: req.body.showName === 'true', showCompany: req.body.showCompany === 'true',
        showPosition: req.body.showPosition === 'true', 
      });

      if (existing) {
        await connection.execute('UPDATE event_designs SET ? WHERE eventoId = ?', [designData, eventId]);
      } else {
        designData.eventoId = eventId;
        await connection.execute('INSERT INTO event_designs SET ?', [designData]);
      }

      await connection.commit();
      res.json({ message: 'Diseño del evento actualizado con éxito.' });
    } catch (error) {
      await connection.rollback();
      console.error("Error updating event design:", error); // Log the full error on the server
      res.status(500).json({ message: 'Error al actualizar el diseño del evento.', details: error.message });
    } finally {
      connection.release();
    }
  });

// --- RUTAS DE DISEÑO DE ESTACIONES ---

const stationDesignFields = `stationId, background_image, button_bg_color, button_text_color, button_hover_bg_color, button_hover_text_color`;

router.route('/station/:stationId')
  .all(authenticateToken, isAdmin)
  .get(async (req, res) => {
    try {
      const [[design]] = await pool.execute(`SELECT ${stationDesignFields} FROM station_designs WHERE stationId = ?`, [req.params.stationId]);
      res.json(design || {});
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener el diseño de la estación', details: error.message });
    }
  })
  .put(upload.single('backgroundImage'), async (req, res) => {
    const { stationId } = req.params;
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [[existing]] = await connection.execute('SELECT background_image FROM station_designs WHERE stationId = ?', [stationId]);
      
      const relativePath = (file) => file ? `/uploads/stations/${stationId}/${file.filename}` : undefined;

      const designData = {
        background_image: req.file ? relativePath(req.file) : existing?.background_image,
        button_bg_color: req.body.button_bg_color, button_text_color: req.body.button_text_color,
        button_hover_bg_color: req.body.button_hover_bg_color, button_hover_text_color: req.body.button_hover_text_color,
      };

      if (existing) {
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
