import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

let pool = null

// Función para crear la base de datos si no existe
export async function ensureDatabaseExists() {
  try {
    // Conexión sin especificar la base de datos
    const tempConnection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 3306
    })

    // Verificar si la base de datos existe
    const [databases] = await tempConnection.execute(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
      [process.env.DB_NAME]
    )

    if (databases.length === 0) {
      // Crear la base de datos
      await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
      console.log(`✅ Base de datos '${process.env.DB_NAME}' creada exitosamente`)
    } else {
      console.log(`✅ Base de datos '${process.env.DB_NAME}' ya existe`)
    }

    await tempConnection.end()
    return true
  } catch (error) {
    console.error('❌ Error al verificar/crear la base de datos:', error.message)
    throw error
  }
}

// Crear el pool de conexiones
export function createPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    })
  }
  return pool
}

// Obtener el pool (se crea después de asegurar que la BD existe)
export function getPool() {
  if (!pool) {
    pool = createPool()
  }
  return pool
}

export default getPool

