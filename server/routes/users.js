import express from 'express';
import bcrypt from 'bcryptjs';
import getPool from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// --- Obtener todos los usuarios (GET /api/users) ---
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool();
    const { rol } = req.query;
    let query = 'SELECT id, identificacion, nombre, ciudad, email, rol, eventoId FROM users';
    const params = [];
    
    if (rol) {
      query += ' WHERE rol = ?';
      params.push(rol);
    }
    
    const [users] = await pool.execute(query, params);
    res.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error interno al obtener usuarios' });
  }
});

// --- Crear un nuevo usuario (POST /api/users) ---
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool();
    const { identificacion, nombre, ciudad, email, password, rol } = req.body;

    if (!password || password.length < 6) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [events] = await pool.execute('SELECT id FROM events WHERE activo = 1 LIMIT 1');
    const eventoId = events.length > 0 ? events[0].id : null;

    const [result] = await pool.execute(
      'INSERT INTO users (identificacion, nombre, ciudad, email, password, rol, eventoId) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [identificacion, nombre, ciudad || null, email, hashedPassword, rol, eventoId]
    );

    const [newUser] = await pool.execute(
      'SELECT id, identificacion, nombre, ciudad, email, rol, eventoId FROM users WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newUser[0]);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    // Manejar error de duplicado
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'El correo o la identificación ya existen.' });
    }
    res.status(500).json({ message: 'Error interno al crear el usuario.' });
  }
});

// --- Editar un usuario (PUT /api/users/:id) ---
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { identificacion, nombre, ciudad, email, password, rol } = req.body;

    // Construcción dinámica y segura de la consulta
    const updateFields = {
      identificacion,
      nombre,
      ciudad: ciudad || null,
      email,
      rol
    };

    // Si se incluye una nueva contraseña, la hasheamos y la añadimos
    if (password && password.trim() !== '') {
        if(password.length < 6){
            return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
        }
      updateFields.password = await bcrypt.hash(password.trim(), 10);
    }

    const fieldNames = Object.keys(updateFields);
    const fieldValues = Object.values(updateFields);
    
    // `SET nombre = ?, email = ?`
    const setClause = fieldNames.map(field => `${field} = ?`).join(', ');

    const query = `UPDATE users SET ${setClause} WHERE id = ?`;
    const params = [...fieldValues, id];

    await pool.execute(query, params);

    // Devolver el usuario actualizado para mantener la UI sincronizada
    const [updatedUser] = await pool.execute(
      'SELECT id, identificacion, nombre, ciudad, email, rol, eventoId FROM users WHERE id = ?',
      [id]
    );

    if (updatedUser.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado después de la actualización.'});
    }

    res.json(updatedUser[0]);

  } catch (error) {
    console.error('Error al editar usuario:', error);
     if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'El correo o la identificación ya pertenecen a otro usuario.' });
    }
    res.status(500).json({ message: 'Error interno al editar el usuario.' });
  }
});

// --- Eliminar un usuario (DELETE /api/users/:id) ---
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    
    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado, no se pudo eliminar.'});
    }

    res.json({ message: 'Usuario eliminado exitosamente.' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error interno al eliminar el usuario.' });
  }
});

export default router;
