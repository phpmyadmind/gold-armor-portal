import getPool from './config/database.js';

const runMigrations = async () => {
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    console.log('Iniciando migraciones de base de datos...');
    await connection.beginTransaction();

    // --- DEFINICIÓN DE ESTRUCTURA DE TABLAS ---
    // Se definen aquí para asegurar que existan antes de cualquier alteración.

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT,
        fechaInicio DATETIME,
        fechaFin DATETIME,
        activo TINYINT(1) DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS stations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        orden INT DEFAULT 1,
        problema TEXT,
        videoUrl VARCHAR(255),
        descripcion TEXT,
        headerText VARCHAR(255) DEFAULT 'ARMADURAS DE ORO',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        texto TEXT NOT NULL,
        tipo ENUM('simple', 'multiple') NOT NULL DEFAULT 'simple',
        opcion1 VARCHAR(255),
        opcion2 VARCHAR(255),
        opcion3 VARCHAR(255),
        opcion4 VARCHAR(255),
        opcion5 VARCHAR(255),
        opcion6 VARCHAR(255),
        respuestaCorrecta_valor TEXT,
        speakerId INT,
        estacionId INT,
        eventoId INT,
        status ENUM('draft', 'active', 'inactive') NOT NULL DEFAULT 'draft',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // --- MIGRACIONES ADICIONALES (Se ejecutan de forma segura) ---
    console.log('Asegurando columnas y tablas adicionales...');

    // Creación segura de tablas de diseño
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS event_designs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        eventId INT UNIQUE,
        FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS station_designs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        stationId INT UNIQUE,
        FOREIGN KEY (stationId) REFERENCES stations(id) ON DELETE CASCADE
      )
    `);

    // Adición segura de columnas de diseño
    const designColumns = {
      footerBgColor: "VARCHAR(255) DEFAULT 'transparent'",
      footerTextColor: "VARCHAR(255) DEFAULT '#FFFFFF'",
      footerLogoUrl: "VARCHAR(255)",
      headerBgColor: "VARCHAR(255) DEFAULT '#000000'",
      headerTextColor: "VARCHAR(255) DEFAULT '#FFFFFF'"
    };

    for (const [column, definition] of Object.entries(designColumns)) {
      try {
        await connection.execute(`ALTER TABLE event_designs ADD COLUMN ${column} ${definition}`);
        console.log(`-> Columna '${column}' añadida a 'event_designs'.`);
      } catch (error) {
        if (error.code !== 'ER_DUP_FIELDNAME') throw error;
      }
    }
    
    await connection.commit();
    console.log('¡Migraciones completadas con éxito!');

  } catch (error) {
    await connection.rollback();
    console.error('Error durante las migraciones:', error);
    // Propagar el error para que el proceso que lo llamó sepa que falló
    throw error;
  } finally {
    connection.release();
    // Solo cerrar el pool si el script se ejecutó directamente
    if (import.meta.url === `file://${process.argv[1]}`) {
        pool.end();
    }
  }
};

// Permite ejecutar el script directamente desde la línea de comandos
if (import.meta.url.startsWith('file://') && process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  runMigrations().catch(err => {
    console.error('Fallo al ejecutar las migraciones de forma independiente.');
    process.exit(1); // Salir con un código de error
  });
}

export default runMigrations;
