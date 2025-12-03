import express from 'express';
import getPool from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// --- Middleware para parsear campos JSON de la BD ---
const parseJsonFields = (req, res, next) => {
  const originalJson = res.json;
  res.json = function(body) {
    const parseFields = (item) => {
      if (item) {
        // Parsear 'opciones' si es un string JSON
        if (typeof item.opciones === 'string') {
          try { item.opciones = JSON.parse(item.opciones); } catch (e) { item.opciones = []; }
        }
        // Parsear 'respuestaCorrecta' si es un string JSON
        if (typeof item.respuestaCorrecta === 'string') {
          try { item.respuestaCorrecta = JSON.parse(item.respuestaCorrecta); } catch (e) { /* No hacer nada si no es JSON */ }
        }
      }
      return item;
    };

    if (Array.isArray(body)) {
      body.forEach(parseFields);
    } else if (typeof body === 'object' && body !== null) {
      parseFields(body);
    }
    
    originalJson.call(this, body);
  };
  next();
};

router.use(parseJsonFields);

const adminOnly = requireRole('admin');

// --- ENDPOINTS COMPLETOS Y CORREGIDOS ---

// Obtener todas las preguntas (admin)
router.get('/', authenticateToken, adminOnly, async (req, res) => {
  try {
    const pool = getPool();
    const [questions] = await pool.execute('SELECT * FROM questions ORDER BY estacionId, id');
    res.json(questions);
  } catch (error) {
    console.error('Error al obtener preguntas:', error);
    res.status(500).json({ message: 'Error interno al obtener preguntas' });
  }
});

// Obtener preguntas activas por estación (para Quizz)
router.get('/station/:stationId', async (req, res) => {
  try {
    const pool = getPool();
    const { stationId } = req.params;
    const [questions] = await pool.execute(
      `SELECT * FROM questions WHERE estacionId = ? AND status = 'active' ORDER BY id`,
      [stationId]
    );
    res.json(questions);
  } catch (error) {
    console.error('Error al obtener preguntas por estación:', error);
    res.status(500).json({ message: 'Error interno al obtener preguntas' });
  }
});


// Crear nueva pregunta
router.post('/', authenticateToken, adminOnly, async (req, res) => {
  try {
    const pool = getPool();
    const { texto, tipo = 'simple', opciones = [], respuestaCorrecta, speakerId, estacionId, eventoId } = req.body;

    if (!texto || !estacionId) {
      return res.status(400).json({ message: 'Los campos texto y estacionId son requeridos.' });
    }

    const opcionesString = JSON.stringify(opciones);
    const respuestaCorrectaString = respuestaCorrecta ? JSON.stringify(respuestaCorrecta) : null;

    const [result] = await pool.execute(
      `INSERT INTO questions (texto, tipo, opciones, respuestaCorrecta, speakerId, estacionId, eventoId, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')`,
      [texto, tipo, opcionesString, respuestaCorrectaString, speakerId || null, estacionId, eventoId || null]
    );

    const [newQuestion] = await pool.execute('SELECT * FROM questions WHERE id = ?', [result.insertId]);
    res.status(201).json(newQuestion[0]);

  } catch (error) {
    console.error('Error al crear la pregunta:', error);
    res.status(500).json({ message: 'Error interno al crear la pregunta.' });
  }
});

// Actualizar el estado de una pregunta
router.put('/:id/status', authenticateToken, adminOnly, async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['draft', 'active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: "El estado proporcionado no es válido. Debe ser 'draft', 'active' o 'inactive'." });
    }

    const [result] = await pool.execute('UPDATE questions SET status = ? WHERE id = ?', [status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'No se encontró ninguna pregunta con el ID proporcionado.' });
    }

    const [updatedQuestion] = await pool.execute('SELECT * FROM questions WHERE id = ?', [id]);
    res.json(updatedQuestion[0]);

  } catch (error) {
    console.error('Error al actualizar el estado de la pregunta:', error);
    res.status(500).json({ message: 'Error interno al actualizar el estado.' });
  }
});

// Actualizar una pregunta completa
router.put('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { texto, tipo, opciones, respuestaCorrecta, speakerId, estacionId, eventoId } = req.body;

    const opcionesString = opciones ? JSON.stringify(opciones) : null;
    const respuestaCorrectaString = respuestaCorrecta ? JSON.stringify(respuestaCorrecta) : null;

    const [result] = await pool.execute(
      `UPDATE questions SET texto = ?, tipo = ?, opciones = ?, respuestaCorrecta = ?, speakerId = ?, estacionId = ?, eventoId = ? WHERE id = ?`,
      [texto, tipo, opcionesString, respuestaCorrectaString, speakerId, estacionId, eventoId, id]
    );

    if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Pregunta no encontrada.' });
    }
    
    const [updatedQuestion] = await pool.execute('SELECT * FROM questions WHERE id = ?', [id]);
    res.json(updatedQuestion[0]);

  } catch (error) {
    console.error('Error al actualizar la pregunta:', error);
    res.status(500).json({ message: 'Error interno al actualizar la pregunta.' });
  }
});

// Eliminar una pregunta
router.delete('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;

    const [result] = await pool.execute('DELETE FROM questions WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Pregunta no encontrada, no se pudo eliminar.' });
    }

    res.json({ message: 'Pregunta eliminada exitosamente.', id: parseInt(id) });
    
  } catch (error) {
    console.error('Error al eliminar la pregunta:', error);
    res.status(500).json({ message: 'Error interno al eliminar la pregunta.' });
  }
});

export default router;