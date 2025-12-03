import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import eventsRoutes from './routes/events.js';
import usersRoutes from './routes/users.js';
import stationsRoutes from './routes/stations.js';
import questionsRoutes from './routes/questions.js';
import responsesRoutes from './routes/responses.js';
import dashboardRoutes from './routes/dashboard.js';
import settingsRoutes from './routes/settings.js';
import runMigrations from './migrations.js';
import { ensureDatabaseExists, createPool } from './config/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5040;

// --- Configuración de CORS desde .env ---
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`El origen '${origin}' no está permitido por la política de CORS.`));
    }
  },
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization',
};

app.use(cors(corsOptions));
app.use(express.json());

// Servir archivos estáticos
app.use('/uploads', express.static('uploads'));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/stations', stationsRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/responses', responsesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);

// --- Inicialización del Servidor ---
async function startServer() {
  try {
    console.log('🔍 Verificando base de datos...');
    await ensureDatabaseExists();
    
    createPool();
    console.log('✅ Pool de conexiones configurado.');
    
    console.log('🔄 Ejecutando migraciones...');
    await runMigrations();
    
    // Mover app.listen aquí asegura que el servidor solo acepte peticiones
    // después de que todo esté inicializado correctamente.
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo y listo para recibir peticiones en http://localhost:${PORT}`);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ El puerto ${PORT} está en uso. ¿Hay otra instancia del servidor corriendo?`);
      } else {
        console.error('🔥 Error al iniciar el listener del servidor:', err);
      }
      process.exit(1);
    });

  } catch (err) {
    console.error('❌ Error fatal durante la inicialización del servidor:', err);
    process.exit(1);
  }
}

// Iniciar todo el proceso.
startServer();
