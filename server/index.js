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
import designRoutes from './routes/designs.js'; // Importar nuevas rutas
import runMigrations from './migrations.js';
import { ensureDatabaseExists, createPool } from './config/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5040;

app.use(cors({ origin: '*', methods: 'GET,POST,PUT,DELETE,OPTIONS', allowedHeaders: 'Content-Type,Authorization' }));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Registrar nuevas rutas de diseño
app.use('/api/designs', designRoutes);

// ... (otras rutas) ...
app.use('/api/auth', authRoutes)
app.use('/api/events', eventsRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/stations', stationsRoutes)
app.use('/api/questions', questionsRoutes)
app.use('/api/responses', responsesRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/settings', settingsRoutes) 

async function startServer() {
  try {
    await ensureDatabaseExists();
    createPool();
    await runMigrations();
    console.log('✅ Servidor listo para recibir peticiones');
  } catch (err) {
    console.error('❌ Error al inicializar el servidor:', err);
    process.exit(1);
  }
}

startServer();

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ El puerto ${PORT} está en uso.`);
    process.exit(1);
  } else {
    console.error('Error al iniciar servidor:', err);
    process.exit(1);
  }
});
