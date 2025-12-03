import getPool from './config/database.js';

const runMigrations = async () => {
  const pool = getPool();
  try {
    // Migration 5: Create event_designs table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS event_designs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        eventoId INT UNIQUE NOT NULL,
        bodyBgColor VARCHAR(255) DEFAULT '#000000',
        bodyBgImage VARCHAR(255),
        headerLogo VARCHAR(255),
        pageLogo VARCHAR(255),
        fontFile VARCHAR(255),
        buttonBgColor VARCHAR(255) DEFAULT '#FF8C00',
        buttonTextColor VARCHAR(255) DEFAULT '#FFFFFF',
        buttonHoverBgColor VARCHAR(255) DEFAULT '#FFA500',
        buttonHoverTextColor VARCHAR(255) DEFAULT '#FFFFFF',
        buttonBorderRadius VARCHAR(50) DEFAULT '8px',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (eventoId) REFERENCES events(id) ON DELETE CASCADE
      )
    `);

    // Migration 6: Create station_designs table
    await pool.execute(`
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

  } catch (error) {
    console.error('Error running migrations:', error);
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
}

export default runMigrations;
