import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import getPool from '../config/database.js'

const router = express.Router()

// Verificar si usuario existe por email
router.post('/verify-user', async (req, res) => {
  try {
    const { email } = req.body
    const pool = getPool()

    if (!email) {
      return res.status(400).json({ message: 'El correo es requerido' })
    }

    const [users] = await pool.execute(
      'SELECT id, identificacion, nombre, ciudad, email, rol, eventoId FROM users WHERE email = ?',
      [email]
    )

    if (users.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado', exists: false })
    }

    const user = users[0]

    // Si es admin, no permitir login desde el registro público
    if (user.rol === 'admin') {
      return res.status(403).json({ 
        message: 'Los administradores deben usar /admin/login para iniciar sesión',
        exists: true
      })
    }

    // Usuario existe y es válido
    return res.json({ exists: true, user })
  } catch (error) {
    console.error('Error en verificación de usuario:', error)
    res.status(500).json({ message: 'Error al verificar usuario' })
  }
})

// Login - Solo con email para usuarios no admin
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const pool = getPool()

    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    )

    if (users.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado' })
    }

    const user = users[0]

    // Si es admin, requiere contraseña
    if (user.rol === 'admin') {
      return res.status(403).json({ 
        message: 'Los administradores deben usar /admin/login para iniciar sesión' 
      })
    }

    // Para usuarios no admin: login solo con email (sin contraseña requerida)
    // NO se valida contraseña para usuarios normales - solo se permite el acceso con email

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    const { password: _, ...userWithoutPassword } = user
    res.json({ token, user: userWithoutPassword })
  } catch (error) {
    console.error('Error en login:', error)
    res.status(500).json({ message: 'Error al iniciar sesión' })
  }
})

// Login Admin - Con email y contraseña hasheada
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const pool = getPool()

    // Validar que email y contraseña sean proporcionados
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'El correo electrónico es requerido' })
    }

    if (!password || password.length === 0) {
      return res.status(400).json({ message: 'La contraseña es requerida' })
    }

    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email.trim()]
    )

    if (users.length === 0) {
      return res.status(401).json({ message: 'Correo o contraseña incorrectos' })
    }

    const user = users[0]

    // Verificar que sea admin
    if (user.rol !== 'admin') {
      return res.status(403).json({ 
        message: 'Solo los administradores pueden acceder aquí' 
      })
    }

    // Verificar que el usuario tenga contraseña
    if (!user.password) {
      return res.status(401).json({ message: 'Correo o contraseña incorrectos' })
    }

    // Validar contraseña con bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Correo o contraseña incorrectos' })
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    const { password: _, ...userWithoutPassword } = user
    res.json({ token, user: userWithoutPassword })
  } catch (error) {
    console.error('Error en login admin:', error)
    res.status(500).json({ message: 'Error al iniciar sesión' })
  }
})

// Register Admin - Permite crear administradores, speakers, staff o usuarios
router.post('/admin/register', async (req, res) => {
  try {
    const { identificacion, nombre, ciudad, email, password, rol } = req.body
    const pool = getPool()

    // Validar campos requeridos
    if (!nombre || nombre.trim().length < 2) {
      return res.status(400).json({ message: 'El nombre es requerido' })
    }
    if (!email) {
      return res.status(400).json({ message: 'El correo electrónico es requerido' })
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' })
    }
    if (!identificacion) {
      return res.status(400).json({ message: 'La identificación es requerida' })
    }

    // Validar que el rol sea válido
    const validRoles = ['admin', 'speaker', 'staff', 'usuario']
    const userRol = rol && validRoles.includes(rol) ? rol : 'usuario'

    // Obtener evento activo si no se proporciona
    const [events] = await pool.execute(
      'SELECT id FROM events WHERE activo = 1 LIMIT 1'
    )
    const eventoId = events.length > 0 ? events[0].id : null

    // Verificar si el usuario ya existe
    const [existingUsers] = await pool.execute(
      'SELECT * FROM users WHERE identificacion = ? OR email = ?',
      [identificacion, email]
    )

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'El usuario ya existe' })
    }

    // Hash de contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Insertar usuario
    const [result] = await pool.execute(
      'INSERT INTO users (identificacion, nombre, ciudad, email, password, rol, eventoId) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [identificacion, nombre.trim(), ciudad || null, email, hashedPassword, userRol, eventoId]
    )

    const userId = result.insertId

    const [newUser] = await pool.execute(
      'SELECT id, identificacion, nombre, ciudad, email, rol, eventoId FROM users WHERE id = ?',
      [userId]
    )

    res.json({ message: 'Usuario registrado exitosamente', user: newUser[0] })
  } catch (error) {
    console.error('Error en registro admin:', error)
    res.status(500).json({ message: 'Error al registrarse' })
  }
})

// Register - Solo para usuarios normales (público)
router.post('/register', async (req, res) => {
  try {
    const { identificacion, nombre, ciudad, email, password, eventoId } = req.body
    const pool = getPool()

    // Forzar rol de usuario - el registro público NO puede crear admins
    const rol = 'usuario'

    // Validar que el nombre no esté vacío
    if (!nombre || nombre.trim().length < 2) {
      return res.status(400).json({ message: 'El nombre es requerido' })
    }

    // Si no se proporciona identificación, generarla desde el email
    let userIdentificacion = identificacion
    if (!userIdentificacion && email) {
      userIdentificacion = email.split('@')[0] || `user_${Date.now()}`
    } else if (!userIdentificacion) {
      userIdentificacion = `user_${Date.now()}`
    }

    // Obtener evento activo si no se proporciona
    let activeEventId = eventoId
    if (!activeEventId) {
      const [events] = await pool.execute(
        'SELECT id FROM events WHERE activo = 1 LIMIT 1'
      )
      if (events.length > 0) {
        activeEventId = events[0].id
      }
    }

    // Verificar si el usuario ya existe (por email o identificación)
    const [existingUsers] = await pool.execute(
      'SELECT * FROM users WHERE identificacion = ? OR email = ?',
      [userIdentificacion, email || '']
    )

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'El usuario ya existe' })
    }

    // Hash de contraseña si se proporciona
    let hashedPassword = null
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10)
    }

    // Insertar usuario - SIEMPRE como 'usuario', nunca como admin
    const [result] = await pool.execute(
      'INSERT INTO users (identificacion, nombre, ciudad, email, password, rol, eventoId) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userIdentificacion, nombre.trim(), ciudad || null, email || null, hashedPassword, rol, activeEventId]
    )

    const userId = result.insertId

    const token = jwt.sign(
      { id: userId, email: email || null, rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    const [newUser] = await pool.execute(
      'SELECT id, identificacion, nombre, ciudad, email, rol, eventoId FROM users WHERE id = ?',
      [userId]
    )

    res.json({ token, user: newUser[0] })
  } catch (error) {
    console.error('Error en registro:', error)
    res.status(500).json({ message: 'Error al registrarse' })
  }
})

export default router

