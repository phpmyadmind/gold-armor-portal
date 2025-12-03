import express from 'express'
import getPool from '../config/database.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'

const router = express.Router()

// --- FUNCIONES AUXILIARES (sin cambios) ---
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
  const columnas = { opcion1: null, opcion2: null, opcion3: null, opcion4: null, opcion5: null, opcion6: null }
  if (Array.isArray(opciones)) {
    opciones.forEach((opcion, index) => {
      if (index < 6 && opcion && opcion.trim()) {
        columnas[`opcion${index + 1}`] = opcion
      }
    })
  }
  return columnas
}

function respuestaAIndices(respuestaCorrecta, opciones, tipo) {
  if (!respuestaCorrecta) return tipo === 'multiple' ? [] : ''
  if (tipo === 'multiple') {
    if (!Array.isArray(respuestaCorrecta)) respuestaCorrecta = [respuestaCorrecta]
    return respuestaCorrecta.map(val => {
      const idx = opciones.indexOf(val)
      return idx >= 0 ? idx : null
    }).filter(i => i !== null)
  } else {
    const val = Array.isArray(respuestaCorrecta) ? respuestaCorrecta[0] : respuestaCorrecta
    const idx = opciones.indexOf(val)
    return idx >= 0 ? idx.toString() : ''
  }
}

function formatQuestionForAdmin(q) {
  const opciones = columnasAOpciones(q)
  const respuestaCorrecta = q.respuestaCorrecta_valor
  let respuestaParaUI = respuestaCorrecta
  if (q.tipo === 'multiple' && respuestaCorrecta && typeof respuestaCorrecta === 'string') {
    try { respuestaParaUI = JSON.parse(respuestaCorrecta) } catch (e) { respuestaParaUI = [respuestaCorrecta] }
  }
  const respuestaIndices = respuestaAIndices(respuestaParaUI, opciones, q.tipo)
  return { ...q, opciones, respuestaCorrecta: respuestaParaUI, respuestaIndices }
}

function formatQuestionForQuiz(q) {
  const opciones = columnasAOpciones(q)
  const respuestaCorrecta = q.respuestaCorrecta_valor
  let respuestaParaUI = respuestaCorrecta
  if (q.tipo === 'multiple' && respuestaCorrecta && typeof respuestaCorrecta === 'string') {
    try { respuestaParaUI = JSON.parse(respuestaCorrecta) } catch (e) { respuestaParaUI = [respuestaCorrecta] }
  }
  return { ...q, opciones, respuestaCorrecta: respuestaParaUI }
}

// --- ENDPOINTS ---

// Obtener todas las preguntas (para admin)
// Devuelve todas las preguntas, incluido su estado
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool()
    const [questions] = await pool.execute('SELECT * FROM questions ORDER BY estacionId, id')
    res.json(questions.map(q => formatQuestionForAdmin(q)))
  } catch (error) {
    console.error('Error al obtener preguntas:', error)
    res.status(500).json({ message: 'Error al obtener preguntas', details: error.message })
  }
})

// Obtener preguntas por estación (para Quizz)
// MODIFICADO: Solo devuelve preguntas con estado 'active'
router.get('/station/:stationId', async (req, res) => {
  try {
    const pool = getPool()
    const { stationId } = req.params
    const [questions] = await pool.execute(
      "SELECT * FROM questions WHERE estacionId = ? AND status = 'active' ORDER BY id",
      [stationId]
    )
    const formattedQuestions = questions.map(q => formatQuestionForQuiz(q)).filter(q => Array.isArray(q.opciones) && q.opciones.length > 0)
    res.json(formattedQuestions)
  } catch (error) {
    console.error('Error al obtener preguntas por estación:', error)
    res.status(500).json({ message: 'Error al obtener preguntas', details: error.message })
  }
})

// Obtener preguntas por speaker (para Quizz)
// MODIFICADO: Solo devuelve preguntas con estado 'active'
router.get('/speaker/:speakerId', async (req, res) => {
  try {
    const pool = getPool()
    const { speakerId } = req.params
    const [questions] = await pool.execute(
      "SELECT * FROM questions WHERE speakerId = ? AND status = 'active' ORDER BY estacionId, id",
      [speakerId]
    )
    res.json(questions.map(q => formatQuestionForQuiz(q)))
  } catch (error) {
    console.error('Error al obtener preguntas por speaker:', error)
    res.status(500).json({ message: 'Error al obtener preguntas', details: error.message })
  }
})

// Crear pregunta
// MODIFICADO: Asigna 'draft' como estado por defecto
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool()
    let { texto, tipo, opciones, respuestaCorrecta, speakerId, estacionId, eventoId } = req.body
    if (!texto || !estacionId) return res.status(400).json({ message: 'Texto y estacionId son requeridos' })

    let respuestaParaBD = null
    if (tipo === 'multiple') {
      if (Array.isArray(respuestaCorrecta) && respuestaCorrecta.length > 0) {
        respuestaParaBD = JSON.stringify(respuestaCorrecta.map(idx => opciones[parseInt(idx)]).filter(v => v !== null))
      }
    } else {
      const idx = parseInt(respuestaCorrecta)
      if (idx >= 0 && idx < opciones.length) respuestaParaBD = opciones[idx]
    }

    const columnasOpciones = opcionesAColumnas(opciones)

    const [result] = await pool.execute(
      `INSERT INTO questions (texto, tipo, opcion1, opcion2, opcion3, opcion4, opcion5, opcion6, respuestaCorrecta_valor, speakerId, estacionId, eventoId, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
      [texto, tipo || 'simple', columnasOpciones.opcion1, columnasOpciones.opcion2, columnasOpciones.opcion3, columnasOpciones.opcion4, columnasOpciones.opcion5, columnasOpciones.opcion6, respuestaParaBD, speakerId || null, estacionId, eventoId || null]
    )
    
    res.status(201).json({ id: result.insertId, texto, tipo, opciones, respuestaCorrecta: respuestaParaBD, status: 'draft' })
  } catch (error) {
    console.error('Error al crear pregunta:', error)
    res.status(500).json({ message: 'Error al crear pregunta', details: error.message })
  }
})

// NUEVO: Actualizar el estado de una pregunta
router.put('/:id/status', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['draft', 'active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: "El estado proporcionado no es válido. Debe ser 'draft', 'active' o 'inactive'." });
    }

    const [result] = await pool.execute(
      'UPDATE questions SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'No se encontró ninguna pregunta con el ID proporcionado.' });
    }

    res.json({ message: `El estado de la pregunta ha sido actualizado a '${status}'.` });
  } catch (error) {
    console.error('Error al actualizar el estado de la pregunta:', error);
    res.status(500).json({ message: 'Error interno al actualizar el estado.' });
  }
});

// Actualizar pregunta (sin cambios, no modifica el estado)
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool()
    const { id } = req.params
    let { texto, tipo, opciones, respuestaCorrecta, speakerId, estacionId, eventoId } = req.body
    
    let respuestaParaBD = null
    if (tipo === 'multiple') {
      if (Array.isArray(respuestaCorrecta) && respuestaCorrecta.length > 0) {
        respuestaParaBD = JSON.stringify(respuestaCorrecta.map(idx => opciones[parseInt(idx)]).filter(v => v !== null))
      }
    } else {
      const idx = parseInt(respuestaCorrecta)
      if (idx >= 0 && idx < opciones.length) respuestaParaBD = opciones[idx]
    }

    const columnasOpciones = opcionesAColumnas(opciones)

    await pool.execute(
      `UPDATE questions SET texto = ?, tipo = ?, opcion1 = ?, opcion2 = ?, opcion3 = ?, opcion4 = ?, opcion5 = ?, opcion6 = ?, respuestaCorrecta_valor = ?, speakerId = ?, estacionId = ?, eventoId = ? WHERE id = ?`,
      [texto, tipo, columnasOpciones.opcion1, columnasOpciones.opcion2, columnasOpciones.opcion3, columnasOpciones.opcion4, columnasOpciones.opcion5, columnasOpciones.opcion6, respuestaParaBD, speakerId || null, estacionId, eventoId, id]
    )
    
    res.json({ message: 'Pregunta actualizada' })
  } catch (error) {
    console.error('Error al actualizar pregunta:', error)
    res.status(500).json({ message: 'Error al actualizar pregunta' })
  }
})

// Eliminar pregunta (sin cambios)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool()
    const { id } = req.params
    await pool.execute('DELETE FROM questions WHERE id = ?', [id])
    res.json({ message: 'Pregunta eliminada' })
  } catch (error) {
    console.error('Error al eliminar pregunta:', error)
    res.status(500).json({ message: 'Error al eliminar pregunta' })
  }
})

export default router
