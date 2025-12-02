
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

    // Migration 4: Update questions table structure
    const [optionColumns] = await pool.execute(`
      SHOW COLUMNS FROM questions LIKE 'opcion%'
    `);

    if (optionColumns.length === 0) {
      // Agregar columnas para 6 opciones individuales y respuesta correcta
      await pool.execute(`
        ALTER TABLE questions
        ADD COLUMN opcion1 VARCHAR(500),
        ADD COLUMN opcion2 VARCHAR(500),
        ADD COLUMN opcion3 VARCHAR(500),
        ADD COLUMN opcion4 VARCHAR(500),
        ADD COLUMN opcion5 VARCHAR(500),
        ADD COLUMN opcion6 VARCHAR(500),
        ADD COLUMN respuestaCorrecta_valor VARCHAR(500)
      `);
      console.log('Columns for options added to "questions" table.');

      // Migrar datos de opciones JSON a columnas individuales
      const [questions] = await pool.execute('SELECT id, opciones, respuestaCorrecta FROM questions');
      
      for (const question of questions) {
        try {
          let opciones = [];
          let respuestaCorrecta = null;

          // Parsear opciones
          if (question.opciones) {
            try {
              opciones = JSON.parse(question.opciones);
            } catch (e) {
              if (typeof question.opciones === 'string') {
                opciones = question.opciones.split(',').map(s => s.trim());
              }
            }
          }

          // Parsear respuesta correcta
          if (question.respuestaCorrecta) {
            try {
              respuestaCorrecta = JSON.parse(question.respuestaCorrecta);
            } catch (e) {
              respuestaCorrecta = question.respuestaCorrecta;
            }
          }

          // Guardar respuesta como string (JSON si es array para multiple)
          let respuestaParaBD = null;
          if (Array.isArray(respuestaCorrecta)) {
            respuestaParaBD = JSON.stringify(respuestaCorrecta);
          } else {
            respuestaParaBD = respuestaCorrecta;
          }

          // Actualizar columnas individuales
          const updates = [];
          const params = [];
          for (let i = 0; i < 6; i++) {
            updates.push(`opcion${i + 1} = ?`);
            params.push(opciones[i] || null);
          }
          updates.push('respuestaCorrecta_valor = ?');
          params.push(respuestaParaBD);
          params.push(question.id);

          await pool.execute(
            `UPDATE questions SET ${updates.join(', ')} WHERE id = ?`,
            params
          );
        } catch (error) {
          console.error(`Error migrating question ${question.id}:`, error);
        }
      }

      console.log('Data migrated from JSON columns to individual option columns.');
    } else {
      console.log('Options columns already exist in "questions" table.');
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
