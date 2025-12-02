import express from 'express'
import getPool from '../config/database.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'

const router = express.Router()

// Función auxiliar para parsear opciones de forma robusta
function parseOpciones(opcionesRaw) {
  try {
    return JSON.parse(opcionesRaw || '[]')
  } catch (err) {
    if (typeof opcionesRaw === 'string' && opcionesRaw.includes(',')) {
      return opcionesRaw.split(',').map(s => s.trim())
    } else if (typeof opcionesRaw === 'string' && opcionesRaw.trim().length) {
      return [opcionesRaw.trim()]
    }
    return []
  }
}

// Función auxiliar para parsear respuesta correcta de forma robusta
function parseRespuestaCorrecta(respuestaRaw) {
  try {
    return JSON.parse(respuestaRaw || 'null')
  } catch (err) {
    // Si no es JSON, mantener como string
    return respuestaRaw || null
  }
}

// Función auxiliar para convertir respuestas a índices (para la UI admin)
function respuestaAIndices(respuestaCorrecta, opciones, tipo) {
  if (tipo === 'multiple') {
    if (!Array.isArray(respuestaCorrecta)) {
      return []
    }
    return respuestaCorrecta
      .map(val => {
        const idx = opciones.indexOf(val)
        return idx >= 0 ? idx : null
      })
      .filter(i => i !== null)
  } else {
    // simple
    if (Array.isArray(respuestaCorrecta)) {
      respuestaCorrecta = respuestaCorrecta[0] || ''
    }
    const idx = opciones.indexOf(respuestaCorrecta)
    return idx >= 0 ? idx.toString() : ''
  }
}

// Función para formatear pregunta con índices para admin UI
function formatQuestionForAdmin(q) {
  const opciones = parseOpciones(q.opciones)
  const respuestaRaw = parseRespuestaCorrecta(q.respuestaCorrecta)
  const respuestaIndices = respuestaAIndices(respuestaRaw, opciones, q.tipo)

  return {
    ...q,
    opciones,
    respuestaCorrecta: respuestaRaw,
    respuestaIndices
  }
}

// Función para formatear pregunta para Quiz (usa textos, no índices)
function formatQuestionForQuiz(q) {
  const opciones = parseOpciones(q.opciones)
  const respuestaRaw = parseRespuestaCorrecta(q.respuestaCorrecta)

  return {
    ...q,
    opciones,
    respuestaCorrecta: respuestaRaw
  }
}

// Obtener todas las preguntas (para admin)
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool()
    const [questions] = await pool.execute(
      'SELECT * FROM questions ORDER BY estacionId, id'
    )
    res.json(questions.map(q => formatQuestionForAdmin(q)))
  } catch (error) {
    console.error('Error al obtener preguntas - Detalles:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState
    })
    res.status(500).json({ 
      message: 'Error al obtener preguntas',
      details: error.message 
    })
  }
})

// Obtener preguntas por estación (para Quiz - usuarios normales)
router.get('/station/:stationId', async (req, res) => {
  try {
    const pool = getPool()
    const { stationId } = req.params
    const [questions] = await pool.execute(
      'SELECT * FROM questions WHERE estacionId = ? ORDER BY id',
      [stationId]
    )
    res.json(questions.map(q => formatQuestionForQuiz(q)))
  } catch (error) {
    console.error('Error al obtener preguntas por estación - Detalles:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState
    })
    res.status(500).json({ 
      message: 'Error al obtener preguntas',
      details: error.message 
    })
  }
})

// Obtener preguntas por speaker
router.get('/speaker/:speakerId', async (req, res) => {
  try {
    const pool = getPool()
    const { speakerId } = req.params
    const [questions] = await pool.execute(
      'SELECT * FROM questions WHERE speakerId = ? ORDER BY estacionId, id',
      [speakerId]
    )
    res.json(questions.map(q => formatQuestionForQuiz(q)))
  } catch (error) {
    console.error('Error al obtener preguntas por speaker - Detalles:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState
    })
    res.status(500).json({ 
      message: 'Error al obtener preguntas',
      details: error.message 
    })
  }
})

// Crear pregunta
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool()
    let { texto, tipo, opciones, respuestaCorrecta, speakerId, estacionId, eventoId } = req.body
    
    console.log('DEBUG POST - Datos recibidos:', {
      texto,
      tipo,
      opciones,
      respuestaCorrecta,
      respuestaCorrecta_type: Array.isArray(respuestaCorrecta) ? 'array' : typeof respuestaCorrecta
    })
    
    // Validar datos requeridos
    if (!texto || !estacionId) {
      return res.status(400).json({ message: 'Texto y estacionId son requeridos' })
    }

    // Convertir índices a textos antes de almacenar
    let respuestaParaBD = null
    if (tipo === 'multiple') {
      // respuestaCorrecta es array de índices [0, 2]
      if (Array.isArray(respuestaCorrecta) && respuestaCorrecta.length > 0) {
        respuestaParaBD = respuestaCorrecta
          .map(idx => {
            const i = parseInt(idx)
            return i >= 0 && i < opciones.length ? opciones[i] : null
          })
          .filter(v => v !== null)
      }
    } else {
      // respuestaCorrecta es índice "1"
      const idx = parseInt(respuestaCorrecta)
      if (idx >= 0 && idx < opciones.length) {
        respuestaParaBD = opciones[idx]
      }
    }
    
    console.log('DEBUG POST - Respuesta para BD:', respuestaParaBD)

    const [result] = await pool.execute(
      'INSERT INTO questions (texto, tipo, opciones, respuestaCorrecta, speakerId, estacionId, eventoId) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        texto,
        tipo || 'simple',
        JSON.stringify(opciones || []),
        JSON.stringify(respuestaParaBD),
        speakerId || null,
        estacionId,
        eventoId || null
      ]
    )
    
    res.json({ id: result.insertId, texto, tipo, opciones, respuestaCorrecta: respuestaParaBD })
  } catch (error) {
    console.error('Error al crear pregunta - Detalles:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState
    })
    res.status(500).json({ 
      message: 'Error al crear pregunta',
      details: error.message 
    })
  }
})

// Actualizar pregunta
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool()
    const { id } = req.params
    let { texto, tipo, opciones, respuestaCorrecta, speakerId, estacionId, eventoId } = req.body
    
    // Convertir índices a textos antes de almacenar
    let respuestaParaBD = null
    if (tipo === 'multiple') {
      // respuestaCorrecta es array de índices [0, 2]
      if (Array.isArray(respuestaCorrecta) && respuestaCorrecta.length > 0) {
        respuestaParaBD = respuestaCorrecta
          .map(idx => {
            const i = parseInt(idx)
            return i >= 0 && i < opciones.length ? opciones[i] : null
          })
          .filter(v => v !== null)
      }
    } else {
      // respuestaCorrecta es índice "1"
      const idx = parseInt(respuestaCorrecta)
      if (idx >= 0 && idx < opciones.length) {
        respuestaParaBD = opciones[idx]
      }
    }

    await pool.execute(
      'UPDATE questions SET texto = ?, tipo = ?, opciones = ?, respuestaCorrecta = ?, speakerId = ?, estacionId = ?, eventoId = ? WHERE id = ?',
      [
        texto,
        tipo,
        JSON.stringify(opciones),
        JSON.stringify(respuestaParaBD),
        speakerId || null,
        estacionId,
        eventoId,
        id
      ]
    )
    
    res.json({ message: 'Pregunta actualizada' })
  } catch (error) {
    console.error('Error al actualizar pregunta:', error)
    res.status(500).json({ message: 'Error al actualizar pregunta' })
  }
})

// Eliminar pregunta
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

