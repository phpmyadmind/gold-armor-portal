/**
 * Normaliza las opciones de una pregunta para asegurar que siempre sea un array
 * @param {any} opcionesRaw - Las opciones que pueden venir como string JSON, array, u otro formato
 * @returns {Array<string>} - Array de opciones normalizado
 */
export function normalizeOpciones(opcionesRaw) {
  // Si ya es un array, retornarlo directamente (sin filtrar para no perder opciones)
  if (Array.isArray(opcionesRaw)) {
    // Solo filtrar valores null/undefined, pero mantener strings vacíos por si acaso
    return opcionesRaw.filter(opcion => opcion != null)
  }
  
  // Si es null o undefined, retornar array vacío
  if (!opcionesRaw) {
    return []
  }
  
  // Si es un string, intentar parsearlo como JSON
  if (typeof opcionesRaw === 'string') {
    // Intentar parsear como JSON primero
    try {
      const parsed = JSON.parse(opcionesRaw)
      if (Array.isArray(parsed)) {
        // Solo filtrar null/undefined, mantener todo lo demás
        return parsed.filter(opcion => opcion != null)
      }
    } catch (err) {
      // Si falla el parseo JSON, continuar con otros métodos
    }
    
    // Si el string contiene comas, dividirlo
    if (opcionesRaw.includes(',')) {
      return opcionesRaw.split(',').map(s => s.trim()).filter(s => s.length > 0)
    }
    
    // Si es un string simple no vacío, retornarlo como array con un elemento
    const trimmed = opcionesRaw.trim()
    if (trimmed.length > 0) {
      return [trimmed]
    }
  }
  
  // Si es un objeto (no array), intentar convertirlo
  if (typeof opcionesRaw === 'object') {
    try {
      const values = Object.values(opcionesRaw)
      return values.filter(opcion => opcion != null && String(opcion).trim().length > 0)
    } catch (err) {
      // Si falla, retornar array vacío
    }
  }
  
  return []
}

/**
 * Normaliza una pregunta completa para asegurar que sus opciones estén en el formato correcto
 * @param {Object} question - Objeto de pregunta
 * @returns {Object} - Pregunta con opciones normalizadas
 */
export function normalizeQuestion(question) {
  if (!question) {
    return null
  }
  
  return {
    ...question,
    opciones: normalizeOpciones(question.opciones)
  }
}

/**
 * Normaliza un array de preguntas
 * @param {Array} questions - Array de preguntas
 * @returns {Array} - Array de preguntas con opciones normalizadas
 */
export function normalizeQuestions(questions) {
  if (!Array.isArray(questions)) {
    return []
  }
  
  return questions.map(normalizeQuestion).filter(q => q != null)
}

