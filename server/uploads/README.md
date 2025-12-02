# Guía de URLs relativas y recursos

## 📋 Cómo funciona el sistema de URLs

### 1. **Rutas relativas en la base de datos**

Puedes guardar las URLs de dos formas en la BD:

#### Opción A: Ruta relativa (recomendado)
```
/uploads/estacion-1.mp4
/uploads/presentacion.pptx
/uploads/imagen.png
```

#### Opción B: URL completa
```
https://ejemplo.com/videos/mi-video.mp4
https://storage.com/archivo.pdf
```

### 2. **Conversión automática de URLs**

El backend convierte automáticamente las rutas relativas a URLs completas:

```
Base de datos: /uploads/estacion-1.mp4
↓ (se convierte a)
API respuesta: http://localhost:5040/uploads/estacion-1.mp4
```

### 3. **Estructura de carpetas**

```
server/
├── uploads/              ← Carpeta para almacenar archivos
│   ├── estacion-1.mp4
│   ├── presentacion.pptx
│   └── imagen.png
├── index.js             ← Configura: app.use('/uploads', express.static('uploads'))
├── routes/
│   ├── stations.js      ← Resuelve videoUrl
│   └── settings.js      ← Resuelve resourcesLink
└── utils/
    └── urlHelper.js     ← Funciones de resolución
```

### 4. **Cómo servir archivos**

#### Copiar archivos a `server/uploads/`:
```bash
# Windows
copy "C:\Descargas\mi-video.mp4" "server\uploads\"

# Linux/Mac
cp ~/Downloads/mi-video.mp4 server/uploads/
```

#### Luego guardar en BD:
```sql
UPDATE stations SET videoUrl = '/uploads/mi-video.mp4' WHERE id = 1;
UPDATE event_settings SET resourcesLink = '/uploads/presentacion.pptx' WHERE eventId = 1;
```

### 5. **Tipos de archivo soportados**

| Tipo | Extensión | Vista previa |
|------|-----------|-------------|
| Videos | mp4, webm | Reproductor HTML5 |
| Imágenes | png, jpg, jpeg, gif | Imagen directa |
| PDF | pdf | Visor Google Docs |
| PowerPoint | pptx, ppt | Visor Google Docs |
| Otros | * | Descarga disponible |

### 6. **Flujo completo de ejemplo**

1. **Guardar en BD**:
   ```sql
   UPDATE stations SET videoUrl = '/uploads/estacion-1.mp4' WHERE id = 1;
   ```

2. **Frontend solicita estación**:
   ```javascript
   GET /api/stations/1
   ```

3. **Backend resuelve URL**:
   - Lee: `/uploads/estacion-1.mp4`
   - Convierte a: `http://localhost:5040/uploads/estacion-1.mp4`
   - Responde: `{ id: 1, videoUrl: "http://localhost:5040/uploads/estacion-1.mp4", ... }`

4. **Frontend recibe y visualiza**:
   ```jsx
   <video src="http://localhost:5040/uploads/estacion-1.mp4" />
   ```

5. **Navegador solicita archivo**:
   ```
   GET http://localhost:5040/uploads/estacion-1.mp4
   → Express sirve: server/uploads/estacion-1.mp4
   ```

### 7. **Funciones de resolución disponibles**

#### `resolveUrl(url)` - Una sola URL
```javascript
resolveUrl('/uploads/video.mp4')
→ 'http://localhost:5040/uploads/video.mp4'
```

#### `resolveUrls(object, fields)` - Objeto con múltiples campos
```javascript
resolveUrls(
  { videoUrl: '/uploads/v.mp4', thumbnail: '/uploads/t.jpg' },
  ['videoUrl', 'thumbnail']
)
→ { videoUrl: 'http://localhost:5040/uploads/v.mp4', ... }
```

#### `resolveUrlsInArray(array, fields)` - Array de objetos
```javascript
resolveUrlsInArray(stations, ['videoUrl'])
→ [
  { id: 1, videoUrl: 'http://localhost:5040/uploads/v1.mp4' },
  { id: 2, videoUrl: 'http://localhost:5040/uploads/v2.mp4' }
]
```

### 8. **Variables de entorno**

En `server/.env`:
```env
PORT=5040
SERVER_URL=http://localhost:5040
# O para producción:
# SERVER_URL=https://tu-dominio.com
```

Si `SERVER_URL` no está definida, usa: `http://localhost:{PORT}`

### 9. **CORS - Archivos desde CDN externo**

Si los archivos están en un dominio diferente (CDN, S3, etc.), asegúrate de que:
1. El servidor CDN tenga CORS habilitado
2. O guarda la URL completa en la BD (sin necesidad de conversión)

```sql
-- Si está en S3:
UPDATE stations SET videoUrl = 'https://bucket.s3.amazonaws.com/video.mp4' WHERE id = 1;
-- Esto se retorna tal cual, sin conversión
```

### 10. **Troubleshooting**

**Problema**: "404 Not Found" en el navegador
- Verificar que el archivo existe en `server/uploads/`
- Verificar que la ruta en BD es correcta: `/uploads/archivo.ext`

**Problema**: "No se puede visualizar el recurso"
- Verificar que el tipo de archivo es soportado
- Revisar consola del navegador para errores CORS
- Asegurar que Express está sirviendo `/uploads` correctamente

**Problema**: URL retorna pero no carga
- Verificar que el servidor está corriendo: `http://localhost:5040`
- Probar acceso directo en navegador: `http://localhost:5040/uploads/archivo.mp4`
- Revisar permisos de carpeta `uploads/`
