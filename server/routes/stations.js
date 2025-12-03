import express from 'express';
import getPool from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { resolveUrls, resolveUrlsInArray } from '../utils/urlHelper.js';

const router = express.Router();
const adminOnly = requireRole('admin');

// Propiedades de una estación para no repetir en las consultas
const STATION_PROPERTIES = 'id, nombre, orden, problema, videoUrl, imageUrl, descripcion, headerText';

// Obtener todas las estaciones (para el frontend principal)
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    // Se quita la autenticación para que cualquier usuario pueda ver las estaciones
    const [stations] = await pool.execute(`SELECT ${STATION_PROPERTIES} FROM stations ORDER BY orden ASC`);
    
    // Resolver URLs relativas a completas para videoUrl y imageUrl
    const resolvedStations = resolveUrlsInArray(stations, ['videoUrl', 'imageUrl']);
    res.json(resolvedStations);
  } catch (error) {
    console.error('Error al obtener estaciones:', error);
    res.status(500).json({ message: 'Error interno al obtener estaciones' });
  }
});

// Obtener una estación por ID (para el detalle y edición)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const [stations] = await pool.execute(`SELECT ${STATION_PROPERTIES} FROM stations WHERE id = ?`, [id]);
    
    if (stations.length === 0) {
      return res.status(404).json({ message: 'Estación no encontrada' });
    }
    
    // Resolver URLs para la estación individual
    const resolvedStation = resolveUrls(stations[0], ['videoUrl', 'imageUrl']);
    res.json(resolvedStation);
  } catch (error) {
    console.error('Error al obtener estación:', error);
    res.status(500).json({ message: 'Error interno al obtener la estación' });
  }
});

// Crear una nueva estación (admin)
router.post('/', authenticateToken, adminOnly, async (req, res) => {
  try {
    const pool = getPool();
    const { nombre, orden, problema, videoUrl, imageUrl, descripcion, headerText } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO stations (nombre, orden, problema, videoUrl, imageUrl, descripcion, headerText) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombre, orden || 1, problema, videoUrl, imageUrl, descripcion, headerText || 'ARMADURAS DE ORO']
    );

    const [newStation] = await pool.execute(`SELECT ${STATION_PROPERTIES} FROM stations WHERE id = ?`, [result.insertId]);
    const resolvedStation = resolveUrls(newStation[0], ['videoUrl', 'imageUrl']);
    res.status(201).json(resolvedStation);
  } catch (error) {
    console.error('Error al crear estación:', error);
    res.status(500).json({ message: 'Error interno al crear la estación' });
  }
});

// Editar una estación (admin)
router.put('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { nombre, orden, problema, videoUrl, imageUrl, descripcion, headerText } = req.body;

    const [result] = await pool.execute(
      'UPDATE stations SET nombre = ?, orden = ?, problema = ?, videoUrl = ?, imageUrl = ?, descripcion = ?, headerText = ? WHERE id = ?',
      [nombre, orden, problema, videoUrl, imageUrl, descripcion, headerText, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Estación no encontrada' });
    }

    const [updatedStation] = await pool.execute(`SELECT ${STATION_PROPERTIES} FROM stations WHERE id = ?`, [id]);
    const resolvedStation = resolveUrls(updatedStation[0], ['videoUrl', 'imageUrl']);
    res.json(resolvedStation);
  } catch (error) {
    console.error('Error al editar estación:', error);
    res.status(500).json({ message: 'Error interno al editar la estación' });
  }
});

// Eliminar una estación (admin)
router.delete('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM stations WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Estación no encontrada' });
    }

    res.status(200).json({ message: 'Estación eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar estación:', error);
    res.status(500).json({ message: 'Error interno al eliminar la estación' });
  }
});

export default router;
