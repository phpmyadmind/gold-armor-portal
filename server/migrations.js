import getPool from './config/database.js';

const runMigrations = async () => {
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    console.log('Iniciando migraciones de base de datos...');
    await connection.beginTransaction();

    // Creación de la tabla event_designs (si no existe)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS event_designs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        eventoId INT UNIQUE NOT NULL,
        bodyBgColor VARCHAR(255) DEFAULT '#FFFFFF',
        bodyBgImage VARCHAR(255),
        headerLogo VARCHAR(255),
        pageLogo VARCHAR(255),
        fontFile VARCHAR(255),
        buttonBgColor VARCHAR(255) DEFAULT '#000000',
        buttonTextColor VARCHAR(255) DEFAULT '#FFFFFF',
        buttonHoverBgColor VARCHAR(255) DEFAULT '#333333',
        buttonHoverTextColor VARCHAR(255) DEFAULT '#FFFFFF',
        buttonBorderRadius VARCHAR(50) DEFAULT '8px',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (eventoId) REFERENCES events(id) ON DELETE CASCADE
      )
    `);
    console.log('Tabla \'event_designs\' asegurada.');

    // Creación de la tabla station_designs (si no existe)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS station_designs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        stationId INT UNIQUE NOT NULL,
        background_image VARCHAR(255),
        button_bg_color VARCHAR(255),
        button_text_color VARCHAR(255),
        button_hover_bg_color VARCHAR(255),
        button_hover_text_color VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (stationId) REFERENCES stations(id) ON DELETE CASCADE
      )
    `);
    console.log('Tabla \'station_designs\' asegurada.');

    // --- AMPLIACIÓN DE EVENT_DESIGNS ---
    const designColumns = {
      footerBgColor: "VARCHAR(255) DEFAULT 'transparent'",
      footerBgImage: "VARCHAR(255)",
      authTitle: "VARCHAR(255) DEFAULT 'Acceso al Evento'",
      authSubtitle: "VARCHAR(255) DEFAULT 'Ingresa o regístrate para continuar'",
      loginTitle: "VARCHAR(255) DEFAULT 'Iniciar Sesión'",
      registerTitle: "VARCHAR(255) DEFAULT 'Crear Cuenta'",
      authFlow: "ENUM('unified', 'separate') DEFAULT 'unified'",
      showName: 'BOOLEAN DEFAULT true',
      showCompany: 'BOOLEAN DEFAULT false',
      showPosition: 'BOOLEAN DEFAULT false'
    };

    for (const [column, definition] of Object.entries(designColumns)) {
      try {
        await connection.execute(`ALTER TABLE event_designs ADD COLUMN ${column} ${definition}`);
        console.log(`-> Columna '${column}' añadida a 'event_designs'.`);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          // La columna ya existe, no es un problema.
        } else {
          throw error; // Lanzar otros errores
        }
      }
    }
    
    await connection.commit();
    console.log('¡Migraciones completadas con éxito!');

  } catch (error) {
    await connection.rollback();
    console.error('Error durante las migraciones:', error);
  } finally {
    connection.release();
    // Cierra el pool si el script se ejecuta directamente, 
    // pero no si se importa desde otro módulo.
    if (import.meta.url === `file://${process.argv[1]}`) {
        pool.end();
    }
  }
};

// Ejecutar solo si el script es llamado directamente desde la terminal
if (import.meta.url.startsWith('file://') && process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  runMigrations();
}

export default runMigrations;
