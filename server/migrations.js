
import getPool from './config/database.js';

const runMigrations = async () => {
  const pool = getPool();
  try {
    console.log('Running migrations...');

    // Migration 1: Create event_settings table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS event_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        eventoId INT UNIQUE NOT NULL,
        bodyBackground VARCHAR(255),
        buttonText VARCHAR(100),
        resourcesLink VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (eventoId) REFERENCES events(id) ON DELETE CASCADE
      )
    `);
    console.log('Table "event_settings" created or already exists.');

    // Migration 2: Add headerText to stations table
    const [columns] = await pool.execute(`
      SHOW COLUMNS FROM stations LIKE 'headerText'
    `);

    if (columns.length === 0) {
      await pool.execute(`
        ALTER TABLE stations
        ADD COLUMN headerText VARCHAR(255) DEFAULT 'ARMADURAS DE ORO'
      `);
      console.log('Column "headerText" added to "stations" table.');
    } else {
      console.log('Column "headerText" already exists in "stations" table.');
    }
    
    // Migration 3: Add videoUrl to stations table (if it doesn't exist)
    const [videoUrlColumns] = await pool.execute(`
      SHOW COLUMNS FROM stations LIKE 'videoUrl'
    `);

    if (videoUrlColumns.length === 0) {
        await pool.execute(`
            ALTER TABLE stations
            ADD COLUMN videoUrl VARCHAR(255)
        `);
        console.log('Column "videoUrl" added to "stations" table.');
    } else {
        console.log('Column "videoUrl" already exists in "stations" table.');
    }

    console.log('Migrations completed successfully.');

  } catch (error) {
    console.error('Error running migrations:', error);
  } finally {
    // The pool is usually managed by the application, so we might not need to end it here.
    // If this script is run standalone, you would end the pool.
    // await pool.end(); 
  }
};

// If this script is executed directly, run the migrations
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
}

export default runMigrations;
