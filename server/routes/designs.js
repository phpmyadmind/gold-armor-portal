import express from 'express';
import getPool from '../config/database.js';
import upload from '../middleware/uploadMiddleware.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
const pool = getPool();
const isAdmin = requireRole('admin');

// --- RUTAS DE DISEÑO DE EVENTOS ---

// Lista completa de campos de diseño para reutilizar en las consultas
const eventDesignFields = `
  eventoId, bodyBgColor, bodyBgImage, headerLogo, pageLogo, fontFile,
  buttonBgColor, buttonTextColor, buttonHoverBgColor, buttonHoverTextColor, buttonBorderRadius,
  footerBgColor, footerBgImage, 
  authTitle, authSubtitle, loginTitle, registerTitle, authFlow,
  showName, showCompany, showPosition
`;

// Middleware para la subida de archivos de diseño del evento
const eventUploads = upload.fields([
    { name: 'bodyBgImage', maxCount: 1 }, 
    { name: 'headerLogo', maxCount: 1 },
    { name: 'pageLogo', maxCount: 1 }, 
    { name: 'fontFile', maxCount: 1 },
    { name: 'footerBgImage', maxCount: 1 }
]);

// Obtener el diseño del evento activo (para el público)
router.get('/event/active', async (req, res) => {
  try {
    const [activeEvents] = await pool.execute('SELECT id FROM events WHERE activo = 1 LIMIT 1');
    if (activeEvents.length === 0) {
      return res.status(404).json({ message: 'No hay un evento activo.' });
    }
    const [[design]] = await pool.execute(`SELECT ${eventDesignFields} FROM event_designs WHERE eventoId = ?`, [activeEvents[0].id]);
    res.json(design || {});
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el diseño del evento', details: error.message });
  }
});

// Obtener y actualizar el diseño para un ID de evento específico (para administradores)
router.route('/event/:eventId')
  .all(authenticateToken, isAdmin)
  .get(async (req, res) => {
    try {
      const [[design]] = await pool.execute(`SELECT ${eventDesignFields} FROM event_designs WHERE eventoId = ?`, [req.params.eventId]);
      if (design) {
        res.json(design);
      } else {
        res.status(404).json({ message: 'No se encontró un diseño para este evento.' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener el diseño', details: error.message });
    }
  })
  .put(eventUploads, async (req, res) => {
    const { eventId } = req.params;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [[existing]] = await connection.execute('SELECT * FROM event_designs WHERE eventoId = ?', [eventId]);

      const relativePath = (file) => file ? `/uploads/${file.filename}` : undefined;

      // Mapea los campos de archivo y prioriza el nuevo archivo si existe, si no, mantiene el anterior.
      const fileFields = {
        bodyBgImage: req.files?.bodyBgImage?.[0],
        headerLogo: req.files?.headerLogo?.[0],
        pageLogo: req.files?.pageLogo?.[0],
        fontFile: req.files?.fontFile?.[0],
        footerBgImage: req.files?.footerBgImage?.[0],
      };

      const designData = {};
      for (const [key, file] of Object.entries(fileFields)) {
        designData[key] = relativePath(file) || existing?.[key];
      }

      // Mapea los campos de texto y booleanos del body
      Object.assign(designData, {
        bodyBgColor: req.body.bodyBgColor, 
        buttonBgColor: req.body.buttonBgColor,
        buttonTextColor: req.body.buttonTextColor, 
        buttonHoverBgColor: req.body.buttonHoverBgColor,
        buttonHoverTextColor: req.body.buttonHoverTextColor, 
        buttonBorderRadius: req.body.buttonBorderRadius,
        footerBgColor: req.body.footerBgColor, 
        authTitle: req.body.authTitle, 
        authSubtitle: req.body.authSubtitle,
        loginTitle: req.body.loginTitle, 
        registerTitle: req.body.registerTitle, 
        authFlow: req.body.authFlow,
        // Convierte a booleano, ya que los datos de formulario llegan como strings
        showName: req.body.showName === 'true', 
        showCompany: req.body.showCompany === 'true',
        showPosition: req.body.showPosition === 'true', 
      });

      // Si ya existe un diseño, lo actualiza. Si no, crea uno nuevo.
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
      console.error('Error en PUT /event/:eventId:', error); // Log detallado en el servidor
      res.status(500).json({ message: 'Error al actualizar el diseño del evento.', details: error.message });
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
      const relativePath = (file) => file ? `/uploads/stations/${file.filename}` : undefined;

      const designData = {
        background_image: relativePath(req.file) || existing?.background_image,
        button_bg_color: req.body.button_bg_color,
        button_text_color: req.body.button_text_color,
        button_hover_bg_color: req.body.button_hover_bg_color,
        button_hover_text_color: req.body.button_hover_text_color,
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
