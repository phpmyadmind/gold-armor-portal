import getPool from './config/database.js';

const runMigrations = async () => {
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    console.log('🚀 Iniciando migraciones de base de datos... Este es el plan maestro.');
    await connection.beginTransaction();

    // ... (Otras tablas sin cambios)
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

    // 2. Tabla de Estaciones (stations) - ¡CON imageUrl AÑADIDO!
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS stations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        orden INT DEFAULT 1,
        problema TEXT,
        videoUrl VARCHAR(255),
        imageUrl VARCHAR(1024), -- URL para la imagen del botón
        descripcion TEXT,
        headerText VARCHAR(255) DEFAULT 'ARMADURAS DE ORO',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

     // 3. Tabla de Usuarios (users)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        identificacion VARCHAR(100) UNIQUE,
        nombre VARCHAR(255) NOT NULL,
        ciudad VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255), -- Hash de la contraseña
        rol ENUM('admin', 'director', 'staff', 'speaker', 'usuario') NOT NULL DEFAULT 'usuario',
        eventoId INT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (eventoId) REFERENCES events(id) ON DELETE SET NULL
      )
    `);

    // 4. Tabla de Preguntas (questions) - ¡CON LA ESTRUCTURA CORRECTA!
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        texto TEXT NOT NULL,
        tipo ENUM('simple', 'multiple') NOT NULL DEFAULT 'simple',
        opciones JSON, -- Columna JSON para las opciones
        respuestaCorrecta JSON, -- Columna JSON para la(s) respuesta(s) correcta(s)
        speakerId INT,
        estacionId INT,
        eventoId INT,
        status ENUM('draft', 'active', 'inactive') NOT NULL DEFAULT 'draft',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (estacionId) REFERENCES stations(id) ON DELETE CASCADE,
        FOREIGN KEY (speakerId) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (eventoId) REFERENCES events(id) ON DELETE SET NULL
      )
    `);

    // 5. Tabla de Respuestas (responses)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS responses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        eventoId INT,
        questionId INT NOT NULL,
        estacionId INT,
        respuestaSeleccionada JSON,
        esCorrecta TINYINT(1) DEFAULT 0,
        tiempoRespuesta INT, -- en segundos
        estado VARCHAR(50) DEFAULT 'completado',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (questionId) REFERENCES questions(id) ON DELETE CASCADE,
        FOREIGN KEY (estacionId) REFERENCES stations(id) ON DELETE CASCADE,
        FOREIGN KEY (eventoId) REFERENCES events(id) ON DELETE SET NULL,
        UNIQUE KEY unique_response (userId, questionId) -- Evita respuestas duplicadas
      )
    `);

    // 6. Tabla de Configuración de Eventos (event_settings)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS event_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        eventId INT NOT NULL UNIQUE,
        bodyBackground VARCHAR(255),
        buttonText VARCHAR(255),
        resourcesLink VARCHAR(1024),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE
      )
    `);

    // --- MIGRACIONES ADICIONALES PARA ACTUALIZAR ESQUEMAS ANTIGUOS ---
    console.log('Verificando y actualizando esquemas antiguos...');

    // Añadir imageUrl a stations de forma segura
    try {
      await connection.execute(`ALTER TABLE stations ADD COLUMN imageUrl VARCHAR(1024)`);
      console.log('-> Columna \'imageUrl\' añadida a la tabla \'stations\'.');
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') throw error;
    }
    
    // (Otras migraciones adicionales sin cambios)
    try {
      await connection.execute(`ALTER TABLE questions CHANGE COLUMN respuestaCorrecta_valor respuestaCorrecta JSON`);
      console.log('-> Columna \'respuestaCorrecta_valor\' renombrada a \'respuestaCorrecta\'.');
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME' && error.code !== 'ER_BAD_FIELD_ERROR') throw error;
    }
    try {
      await connection.execute(`ALTER TABLE questions MODIFY COLUMN opciones JSON`);
      console.log('-> Tipo de columna \'opciones\' actualizado a JSON.');
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') throw error;
    }

    await connection.commit();
    console.log('✅ ¡Migraciones completadas con éxito! La base de datos está lista.');

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error crítico durante las migraciones. La transacción fue revertida.', error);
    throw error;
  } finally {
    connection.release();
  }
};

export default runMigrations;
