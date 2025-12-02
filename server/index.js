import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import eventsRoutes from './routes/events.js'
import usersRoutes from './routes/users.js'
import stationsRoutes from './routes/stations.js'
import questionsRoutes from './routes/questions.js'
import responsesRoutes from './routes/responses.js'
import dashboardRoutes from './routes/dashboard.js'
import settingsRoutes from './routes/settings.js'
import runMigrations from './migrations.js'
import { ensureDatabaseExists, createPool, getPool } from './config/database.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5040

const corsOptions = {
  origin: '*',
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization',
};
app.use(cors(corsOptions))
app.use(express.json())

// Servir archivos estáticos desde la carpeta uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Rutas
app.use('/api/auth', authRoutes)
app.use('/api/events', eventsRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/stations', stationsRoutes)
app.use('/api/questions', questionsRoutes)
app.use('/api/responses', responsesRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/settings', settingsRoutes) // Usar nueva ruta

// Inicializar base de datos y servidor
async function startServer() {
  try {
    // 1. Verificar y crear la base de datos si no existe
    console.log('🔍 Verificando base de datos...')
    await ensureDatabaseExists()
    
    // 2. Crear el pool de conexiones
    const pool = createPool()
    console.log('✅ Conectado a MySQL')
    
    // 3. Verificar conexión
    const connection = await pool.getConnection()
    connection.release()
    
    // 4. Crear tablas si no existen
    await initializeDatabase(pool)
    
    // 5. Ejecutar migraciones
    console.log('🔄 Ejecutando migraciones...')
    await runMigrations()
    
    console.log('✅ Servidor listo para recibir peticiones')
  } catch (err) {
    console.error('❌ Error al inicializar la base de datos:', err)
    console.error('Detalles:', err.message)
    process.exit(1)
  }
}

// Iniciar servidor y base de datos
startServer()

async function initializeDatabase(pool) {
  try {
    console.log('🔧 Creando tablas si no existen...')
    // Tabla de eventos
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT,
        fechaInicio DATE,
        fechaFin DATE,
        activo BOOLEAN DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    // Tabla de usuarios
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        identificacion VARCHAR(50) UNIQUE NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        ciudad VARCHAR(100),
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        rol ENUM('usuario', 'admin', 'speaker', 'staff', 'director') DEFAULT 'usuario',
        eventoId INT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (eventoId) REFERENCES events(id) ON DELETE SET NULL
      )
    `)

    // Tabla de estaciones
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS stations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        orden INT DEFAULT 0,
        problema TEXT,
        videoUrl VARCHAR(500),
        descripcion TEXT,
        headerText VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    // Tabla de configuración de eventos
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS event_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        eventId INT NOT NULL,
        bodyBackground VARCHAR(255),
        buttonText VARCHAR(255),
        resourcesLink VARCHAR(500),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE
      )
    `)

    // Tabla de preguntas
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        eventoId INT,
        texto TEXT NOT NULL,
        tipo ENUM('simple', 'multiple') DEFAULT 'simple',
        opciones JSON,
        respuestaCorrecta JSON,
        speakerId INT,
        estacionId INT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (eventoId) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (speakerId) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (estacionId) REFERENCES stations(id) ON DELETE CASCADE
      )
    `)

    // Tabla de respuestas
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS responses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        eventoId INT,
        questionId INT NOT NULL,
        estacionId INT NOT NULL,
        respuestaSeleccionada JSON,
        esCorrecta BOOLEAN DEFAULT 0,
        tiempoRespuesta INT DEFAULT 0,
        estado ENUM('pendiente', 'completado') DEFAULT 'pendiente',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (eventoId) REFERENCES events(id) ON DELETE SET NULL,
        FOREIGN KEY (questionId) REFERENCES questions(id) ON DELETE CASCADE,
        FOREIGN KEY (estacionId) REFERENCES stations(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_question (userId, questionId)
      )
    `)

    console.log('✅ Tablas creadas/verificadas correctamente')
  } catch (error) {
    console.error('❌ Error al inicializar tablas:', error)
    throw error
  }
}

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ El puerto ${PORT} está en uso.`)
    console.log(`💡 Soluciones:`)
    console.log(`   1. Cerrar el proceso que usa el puerto: netstat -ano | findstr :${PORT}`)
    console.log(`   2. Cambiar el puerto en server/.env (PORT=5001)`)
    process.exit(1)
  } else {
    console.error('Error al iniciar servidor:', err)
    process.exit(1)
  }
})
