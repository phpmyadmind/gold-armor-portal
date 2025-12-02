import express from 'express'
import getPool from '../config/database.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'

const router = express.Router()

// Función auxiliar para convertir columnas individuales a array de opciones
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

// Función auxiliar para convertir array de opciones a columnas individuales
function opcionesAColumnas(opciones) {
  const columnas = {
    opcion1: null,
    opcion2: null,
    opcion3: null,
    opcion4: null,
    opcion5: null,
    opcion6: null
  }
  
  if (Array.isArray(opciones)) {
    opciones.forEach((opcion, index) => {
      if (index < 6 && opcion && opcion.trim()) {
        columnas[`opcion${index + 1}`] = opcion
      }
    })
  }
  
  return columnas
}

// Función auxiliar para convertir respuestas a índices (para la UI admin)
function respuestaAIndices(respuestaCorrecta, opciones, tipo) {
  if (!respuestaCorrecta) {
    return tipo === 'multiple' ? [] : ''
  }

  if (tipo === 'multiple') {
    if (!Array.isArray(respuestaCorrecta)) {
      respuestaCorrecta = [respuestaCorrecta]
    }
    return respuestaCorrecta
      .map(val => {
        const idx = opciones.indexOf(val)
        return idx >= 0 ? idx : null
      })
      .filter(i => i !== null)
  } else {
    // simple
    const val = Array.isArray(respuestaCorrecta) ? respuestaCorrecta[0] : respuestaCorrecta
    const idx = opciones.indexOf(val)
    return idx >= 0 ? idx.toString() : ''
  }
}

// Función para formatear pregunta con índices para admin UI
function formatQuestionForAdmin(q) {
  const opciones = columnasAOpciones(q)
  const respuestaCorrecta = q.respuestaCorrecta_valor

  // Convertir respuesta a array si es multiple
  let respuestaParaUI = respuestaCorrecta
  if (q.tipo === 'multiple' && respuestaCorrecta && typeof respuestaCorrecta === 'string') {
    try {
      respuestaParaUI = JSON.parse(respuestaCorrecta)
    } catch (e) {
      respuestaParaUI = [respuestaCorrecta]
    }
  }

  const respuestaIndices = respuestaAIndices(respuestaParaUI, opciones, q.tipo)

  return {
    ...q,
    opciones,
    respuestaCorrecta: respuestaParaUI,
    respuestaIndices
  }
}

// Función para formatear pregunta para Quizz (usa textos, no índices)
function formatQuestionForQuiz(q) {
  const opciones = columnasAOpciones(q)
  const respuestaCorrecta = q.respuestaCorrecta_valor

  // Convertir respuesta a array si es multiple
  let respuestaParaUI = respuestaCorrecta
  if (q.tipo === 'multiple' && respuestaCorrecta && typeof respuestaCorrecta === 'string') {
    try {
      respuestaParaUI = JSON.parse(respuestaCorrecta)
    } catch (e) {
      respuestaParaUI = [respuestaCorrecta]
    }
  }

  return {
    ...q,
    opciones,
    respuestaCorrecta: respuestaParaUI
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

// Obtener preguntas por estación (para Quizz - usuarios normales)
// Este endpoint es público y accesible para todos los usuarios (incluido rol "usuario")
router.get('/station/:stationId', async (req, res) => {
  try {
    const pool = getPool()
    const { stationId } = req.params
    const [questions] = await pool.execute(
      'SELECT * FROM questions WHERE estacionId = ? ORDER BY id',
      [stationId]
    )
    
    if (questions.length === 0) {
      return res.json([])
    }
    
    const formattedQuestions = questions.map(q => {
      const formatted = formatQuestionForQuiz(q)
      // Asegurar que las opciones sean un array válido
      if (!Array.isArray(formatted.opciones) || formatted.opciones.length === 0) {
        console.warn(`⚠️ Pregunta ${q.id} de estación ${stationId} no tiene opciones válidas`, {
          opcionesRaw: q.opciones,
          tipo: typeof q.opciones
        })
      }
      return formatted
    }).filter(q => {
      // Filtrar preguntas sin opciones válidas para evitar errores en el frontend
      const tieneOpciones = Array.isArray(q.opciones) && q.opciones.length > 0
      if (!tieneOpciones) {
        console.warn(`⚠️ Filtrando pregunta ${q.id} sin opciones válidas`)
      }
      return tieneOpciones
    })
    
    console.log(`✅ Estación ${stationId}: ${formattedQuestions.length} preguntas con opciones válidas de ${questions.length} totales`)
    
    res.json(formattedQuestions)
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
        // Guardar como JSON para multiple
        respuestaParaBD = JSON.stringify(respuestaParaBD)
      }
    } else {
      // respuestaCorrecta es índice "1"
      const idx = parseInt(respuestaCorrecta)
      if (idx >= 0 && idx < opciones.length) {
        respuestaParaBD = opciones[idx]
      }
    }

    // Convertir opciones a columnas individuales
    const columnasOpciones = opcionesAColumnas(opciones)

    const [result] = await pool.execute(
      `INSERT INTO questions (texto, tipo, opcion1, opcion2, opcion3, opcion4, opcion5, opcion6, respuestaCorrecta_valor, speakerId, estacionId, eventoId) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        texto,
        tipo || 'simple',
        columnasOpciones.opcion1,
        columnasOpciones.opcion2,
        columnasOpciones.opcion3,
        columnasOpciones.opcion4,
        columnasOpciones.opcion5,
        columnasOpciones.opcion6,
        respuestaParaBD,
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
        // Guardar como JSON para multiple
        respuestaParaBD = JSON.stringify(respuestaParaBD)
      }
    } else {
      // respuestaCorrecta es índice "1"
      const idx = parseInt(respuestaCorrecta)
      if (idx >= 0 && idx < opciones.length) {
        respuestaParaBD = opciones[idx]
      }
    }

    // Convertir opciones a columnas individuales
    const columnasOpciones = opcionesAColumnas(opciones)

    await pool.execute(
      `UPDATE questions SET texto = ?, tipo = ?, opcion1 = ?, opcion2 = ?, opcion3 = ?, opcion4 = ?, opcion5 = ?, opcion6 = ?, respuestaCorrecta_valor = ?, speakerId = ?, estacionId = ?, eventoId = ? WHERE id = ?`,
      [
        texto,
        tipo,
        columnasOpciones.opcion1,
        columnasOpciones.opcion2,
        columnasOpciones.opcion3,
        columnasOpciones.opcion4,
        columnasOpciones.opcion5,
        columnasOpciones.opcion6,
        respuestaParaBD,
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

