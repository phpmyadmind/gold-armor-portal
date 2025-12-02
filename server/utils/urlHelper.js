// Función para convertir rutas relativas a URLs completas
export function resolveUrl(url, baseUrl = '') {
  if (!url) return null;

  // Si es una URL completa (http, https, data:, blob:, etc), retornarla tal cual
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  // Si es una ruta relativa local
  if (url.startsWith('/')) {
    // Obtener el host del servidor desde las variables de entorno o usar localhost
    const serverHost = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5040}`;
    return `${serverHost}${url}`;
  }

  // Si es una ruta relativa sin /, prefijamos /uploads/
  if (!url.includes('://') && !url.startsWith('/')) {
    const serverHost = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5040}`;
    return `${serverHost}/uploads/${url}`;
  }

  return url;
}

// Función para procesar múltiples URLs
export function resolveUrls(obj, fieldsToResolve = []) {
  if (!obj || typeof obj !== 'object') return obj;

  const resolved = { ...obj };
  
  for (const field of fieldsToResolve) {
    if (resolved[field]) {
      resolved[field] = resolveUrl(resolved[field]);
    }
  }

  return resolved;
}

// Función para procesar arrays de objetos
export function resolveUrlsInArray(array, fieldsToResolve = []) {
  return array.map(item => resolveUrls(item, fieldsToResolve));
}
