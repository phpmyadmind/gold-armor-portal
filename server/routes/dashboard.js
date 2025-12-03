import express from 'express';
import getPool from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import * as XLSX from 'xlsx';

const router = express.Router();

// Roles permitidos para todo el dashboard
const allowedRoles = requireRole('admin', 'director', 'staff');

// --- Endpoints del Dashboard Corregidos y Mejorados ---

// Estadísticas generales
router.get('/stats', authenticateToken, allowedRoles, async (req, res) => {
  try {
    const pool = getPool();
    const [totalUsers] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE rol = "usuario"');
    const [completedUsers] = await pool.execute('SELECT COUNT(DISTINCT userId) as count FROM responses WHERE estado = "completado"');
    
    const totalUsuarios = totalUsers[0].count;
    const usuariosCompletados = completedUsers[0].count;
    const porcentajeCompletacion = totalUsuarios > 0 ? (usuariosCompletados / totalUsuarios) * 100 : 0;

    res.json({
      totalUsuarios,
      usuariosCompletados,
      // Corregido: Devolver siempre un número. El frontend se encarga de formatear.
      porcentajeCompletacion: Math.round(porcentajeCompletacion * 100) / 100
    });
  } catch (error) {
    console.error('Error al obtener estadísticas generales:', error);
    res.status(500).json({ message: 'Error interno al obtener las estadísticas' });
  }
});

// Estadísticas por pregunta
router.get('/questions-stats', authenticateToken, allowedRoles, async (req, res) => {
  try {
    const pool = getPool();
    const [stats] = await pool.execute(`
      SELECT 
        q.id, SUBSTRING(q.texto, 1, 50) as pregunta,
        SUM(CASE WHEN r.esCorrecta = 1 THEN 1 ELSE 0 END) as correctas,
        SUM(CASE WHEN r.esCorrecta = 0 THEN 1 ELSE 0 END) as incorrectas
      FROM questions q
      LEFT JOIN responses r ON q.id = r.questionId
      GROUP BY q.id, q.texto
      ORDER BY q.estacionId, q.id
    `);
    // Asegurar que los valores sean numéricos
    const formattedStats = stats.map(s => ({...s, correctas: Number(s.correctas) || 0, incorrectas: Number(s.incorrectas) || 0 }))
    res.json(formattedStats);
  } catch (error) {
    console.error('Error al obtener estadísticas de preguntas:', error);
    res.status(500).json({ message: 'Error interno al obtener las estadísticas de preguntas' });
  }
});

// Estadísticas por speaker
router.get('/speakers-stats', authenticateToken, allowedRoles, async (req, res) => {
  try {
    const pool = getPool();
    const [stats] = await pool.execute(`
      SELECT 
        u.nombre as speaker, AVG(r.esCorrecta) * 100 as promedio
      FROM questions q
      INNER JOIN users u ON q.speakerId = u.id
      LEFT JOIN responses r ON q.id = r.questionId
      WHERE u.rol = 'speaker'
      GROUP BY u.id, u.nombre
      ORDER BY promedio DESC
    `);
    // Corregido: Devolver un número, no un string.
    const formattedStats = stats.map(s => ({...s, promedio: Math.round((Number(s.promedio) || 0) * 100) / 100 }))
    res.json(formattedStats);
  } catch (error) {
    console.error('Error al obtener estadísticas de speakers:', error);
    res.status(500).json({ message: 'Error interno al obtener las estadísticas de speakers' });
  }
});

// Top 5 usuarios
router.get('/top-users', authenticateToken, allowedRoles, async (req, res) => {
  try {
    const pool = getPool();
    const [topUsers] = await pool.execute(`
      SELECT 
        u.id, u.nombre, u.ciudad,
        AVG(r.esCorrecta) * 100 as puntuacion,
        AVG(r.tiempoRespuesta) as tiempoPromedio
      FROM users u
      LEFT JOIN responses r ON u.id = r.userId AND r.estado = "completado"
      WHERE u.rol = "usuario"
      GROUP BY u.id, u.nombre, u.ciudad
      HAVING COUNT(r.id) > 0
      ORDER BY puntuacion DESC, tiempoPromedio ASC
      LIMIT 5
    `);
    
    const formattedUsers = topUsers.map(user => ({
      ...user,
      puntuacion: Math.round((Number(user.puntuacion) || 0) * 100) / 100,
      tiempoPromedio: Math.round((Number(user.tiempoPromedio) || 0) * 100) / 100
    }));
    
    res.json(formattedUsers);
  } catch (error) {
    console.error('Error al obtener top usuarios:', error);
    res.status(500).json({ message: 'Error interno al obtener el top de usuarios' });
  }
});

// Exportar a Excel (con datos legibles)
router.get('/export/excel', authenticateToken, allowedRoles, async (req, res) => {
  try {
    const pool = getPool();
    const [data] = await pool.execute(`
      SELECT 
        u.nombre as Usuario, u.identificacion as Identificacion, u.ciudad as Ciudad,
        e.nombre as Evento, s.nombre as Estacion, q.texto as Pregunta,
        r.respuestaSeleccionada as Respuesta, -- Este es un JSON
        CASE WHEN r.esCorrecta = 1 THEN 'Correcta' ELSE 'Incorrecta' END as Resultado,
        r.tiempoRespuesta as 'Tiempo (segundos)', r.createdAt as Fecha
      FROM responses r
      INNER JOIN users u ON r.userId = u.id
      LEFT JOIN events e ON r.eventoId = e.id
      LEFT JOIN stations s ON r.estacionId = s.id
      LEFT JOIN questions q ON r.questionId = q.id
      ORDER BY u.nombre, r.createdAt DESC
    `);
    
    // Mejorado: Procesar los datos para que sean legibles en Excel
    const processedData = data.map(row => {
      let respuestaFormateada = row.Respuesta;
      try {
        // Intentar parsear la respuesta JSON
        const parsed = JSON.parse(row.Respuesta);
        // Si es un array, unirlo con comas. Si no, mostrarlo tal cual.
        respuestaFormateada = Array.isArray(parsed) ? parsed.join(', ') : parsed;
      } catch (e) {
        // Si no es un JSON válido, dejar el valor original
      }
      return { ...row, Respuesta: respuestaFormateada };
    });
    
    const worksheet = XLSX.utils.json_to_sheet(processedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Respuestas');
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Disposition', `attachment; filename=reporte-respuestas-${new Date().toISOString().split('T')[0]}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    res.status(500).json({ message: 'Error interno al generar el reporte Excel.' });
  }
});

export default router;
