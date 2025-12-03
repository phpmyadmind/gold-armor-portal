import express from 'express'
import getPool from '../config/database.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'

const router = express.Router()

// ... (funciones auxiliares como columnasAOpciones, etc. se mantienen igual)
function columnasAOpciones(row) {
  const opciones = []
  for (let i = 1; i <= 6; i++) {
    const opcion = row[`opcion${i}`]
    if (opcion && opcion.trim()) {
      opciones.push(opcion)
    }
  }
  return opciones
}

function opcionesAColumnas(opciones) {
  const columnas = { opcion1: null, opcion2: null, opcion3: null, opcion4: null, opcion5: null, opcion6: null };
  if (Array.isArray(opciones)) {
    opciones.forEach((opcion, index) => {
      if (index < 6 && opcion && opcion.trim()) {
        columnas[`opcion${index + 1}`] = opcion;
      }
    });
  }
  return columnas;
}

function respuestaAIndices(respuestaCorrecta, opciones, tipo) {
  if (!respuestaCorrecta) return tipo === 'multiple' ? [] : '';
  if (tipo === 'multiple') {
    if (!Array.isArray(respuestaCorrecta)) respuestaCorrecta = [respuestaCorrecta];
    return respuestaCorrecta.map(val => {
      const idx = opciones.indexOf(val);
      return idx >= 0 ? idx : null;
    }).filter(i => i !== null);
  } else {
    const val = Array.isArray(respuestaCorrecta) ? respuestaCorrecta[0] : respuestaCorrecta;
    const idx = opciones.indexOf(val);
    return idx >= 0 ? idx.toString() : '';
  }
}

function formatQuestionForAdmin(q) {
  const opciones = columnasAOpciones(q);
  const respuestaCorrecta = q.respuestaCorrecta_valor;
  let respuestaParaUI = respuestaCorrecta;
  if (q.tipo === 'multiple' && respuestaCorrecta && typeof respuestaCorrecta === 'string') {
    try { respuestaParaUI = JSON.parse(respuestaCorrecta); } catch (e) { respuestaParaUI = [respuestaCorrecta]; }
  }
  const respuestaIndices = respuestaAIndices(respuestaParaUI, opciones, q.tipo);
  return { ...q, opciones, respuestaCorrecta: respuestaParaUI, respuestaIndices };
}

function formatQuestionForQuiz(q) {
  const opciones = columnasAOpciones(q);
  const respuestaCorrecta = q.respuestaCorrecta_valor;
  let respuestaParaUI = respuestaCorrecta;
  if (q.tipo === 'multiple' && respuestaCorrecta && typeof respuestaCorrecta === 'string') {
    try { respuestaParaUI = JSON.parse(respuestaCorrecta); } catch (e) { respuestaParaUI = [respuestaCorrecta]; }
  }
  return { ...q, opciones, respuestaCorrecta: respuestaParaUI };
}

// Obtener todas las preguntas (para admin)
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool();
    const [questions] = await pool.execute('SELECT * FROM questions ORDER BY estacionId, id');
    res.json(questions.map(q => formatQuestionForAdmin(q)));
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener preguntas', details: error.message });
  }
});

// Obtener preguntas por estación para el Quiz (SOLO ACTIVAS)
router.get('/station/:stationId', async (req, res) => {
  try {
    const pool = getPool();
    const { stationId } = req.params;
    const [questions] = await pool.execute(
      `SELECT * FROM questions WHERE estacionId = ? AND estado = 'activa' ORDER BY id`,
      [stationId]
    );
    const formattedQuestions = questions.map(q => formatQuestionForQuiz(q)).filter(q => Array.isArray(q.opciones) && q.opciones.length > 0);
    res.json(formattedQuestions);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener preguntas por estación', details: error.message });
  }
});

// Crear pregunta (por defecto 'activa')
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool()
    let { texto, tipo, opciones, respuestaCorrecta, speakerId, estacionId, eventoId } = req.body
    if (!texto || !estacionId) return res.status(400).json({ message: 'Texto y estacionId son requeridos' })

    let respuestaParaBD = null;
    if (tipo === 'multiple') {
      if (Array.isArray(respuestaCorrecta) && respuestaCorrecta.length > 0) {
        respuestaParaBD = JSON.stringify(respuestaCorrecta.map(idx => opciones[parseInt(idx)]).filter(v => v));
      }
    } else {
      const idx = parseInt(respuestaCorrecta);
      if (idx >= 0 && idx < opciones.length) respuestaParaBD = opciones[idx];
    }

    const columnasOpciones = opcionesAColumnas(opciones);

    const [result] = await pool.execute(
      `INSERT INTO questions (texto, tipo, opcion1, opcion2, opcion3, opcion4, opcion5, opcion6, respuestaCorrecta_valor, speakerId, estacionId, eventoId, estado) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'activa')`,
      [texto, tipo || 'simple', ...Object.values(columnasOpciones), respuestaParaBD, speakerId || null, estacionId, eventoId || null]
    );
    res.json({ id: result.insertId, texto, tipo, opciones, respuestaCorrecta: respuestaParaBD, estado: 'activa' });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear pregunta', details: error.message });
  }
});

// Actualizar pregunta
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    let { texto, tipo, opciones, respuestaCorrecta, speakerId, estacionId, eventoId, estado } = req.body;

    let respuestaParaBD = null;
    if (tipo === 'multiple') {
      if (Array.isArray(respuestaCorrecta) && respuestaCorrecta.length > 0) {
        respuestaParaBD = JSON.stringify(respuestaCorrecta.map(idx => opciones[parseInt(idx)]).filter(v => v));
      }
    } else {
      const idx = parseInt(respuestaCorrecta);
      if (idx >= 0 && idx < opciones.length) respuestaParaBD = opciones[idx];
    }

    const columnasOpciones = opcionesAColumnas(opciones);

    await pool.execute(
      `UPDATE questions SET texto = ?, tipo = ?, opcion1 = ?, opcion2 = ?, opcion3 = ?, opcion4 = ?, opcion5 = ?, opcion6 = ?, respuestaCorrecta_valor = ?, speakerId = ?, estacionId = ?, eventoId = ?, estado = ? WHERE id = ?`,
      [texto, tipo, ...Object.values(columnasOpciones), respuestaParaBD, speakerId || null, estacionId, eventoId, estado || 'activa', id]
    );
    res.json({ message: 'Pregunta actualizada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar pregunta', details: error.message });
  }
});

// Actualizar estado de una pregunta
router.patch('/:id/estado', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { estado } = req.body;

    if (!['activa', 'inactiva'].includes(estado)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }

    await pool.execute('UPDATE questions SET estado = ? WHERE id = ?', [estado, id]);
    res.json({ message: 'Estado de la pregunta actualizado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar estado de la pregunta', details: error.message });
  }
});

// Eliminar pregunta
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    await pool.execute('DELETE FROM questions WHERE id = ?', [id]);
    res.json({ message: 'Pregunta eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar pregunta', details: error.message });
  }
});

export default router;
