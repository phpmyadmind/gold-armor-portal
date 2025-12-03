import getPool from './config/database.js';

const runMigrations = async () => {
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    console.log('Iniciando migraciones de base de datos...');
    await connection.beginTransaction();

    // --- ESTRUCTURA DE TABLAS PRINCIPALES ---
    await connection.execute(`CREATE TABLE IF NOT EXISTS events (...)`);
    await connection.execute(`CREATE TABLE IF NOT EXISTS stations (...)`);
    await connection.execute(`CREATE TABLE IF NOT EXISTS trivias (...)`);
    await connection.execute(`CREATE TABLE IF NOT EXISTS questions (...)`);
    // ... (otras tablas existentes)

    // --- MIGRACIÓN: AÑADIR ESTADO A LAS PREGUNTAS ---
    try {
      await connection.execute(`
        ALTER TABLE questions 
        ADD COLUMN status ENUM('draft', 'active', 'inactive') NOT NULL DEFAULT 'draft'
      `);
      console.log('-> Columna \'status\' añadida a la tabla \'questions\'.');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('Columna \'status\' en \'questions\' ya existe, no se realizaron cambios.');
      } else {
        throw error; // Lanzar otros errores inesperados
      }
    }

    // --- MIGRACIONES ANTERIORES (re-integradas de forma segura) ---
    await connection.execute(`CREATE TABLE IF NOT EXISTS event_designs (...)`);
    await connection.execute(`CREATE TABLE IF NOT EXISTS station_designs (...)`);

    const designColumns = {
      footerBgColor: "VARCHAR(255) DEFAULT 'transparent'",
      // ... (resto de columnas de diseño)
    };

    for (const [column, definition] of Object.entries(designColumns)) {
      try {
        await connection.execute(`ALTER TABLE event_designs ADD COLUMN ${column} ${definition}`);
        console.log(`-> Columna \'${column}\' añadida a \'event_designs\'.`);
      } catch (error) {
        if (error.code !== 'ER_DUP_FIELDNAME') throw error;
      }
    }

    await connection.commit();
    console.log('¡Migraciones completadas con éxito!');

  } catch (error) {
    await connection.rollback();
    console.error('Error durante las migraciones:', error);
  } finally {
    connection.release();
    if (import.meta.url === `file://${process.argv[1]}`) {
        pool.end();
    }
  }
};

if (import.meta.url.startsWith('file://') && process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  runMigrations();
}

export default runMigrations;
