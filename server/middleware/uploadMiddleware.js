import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Configuración de almacenamiento para Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // La carpeta de destino depende del evento que se está editando
    const eventId = req.params.eventId;
    if (!eventId) {
      return cb(new Error('El ID del evento es requerido para guardar archivos'), null);
    }

    const dir = path.join('uploads', eventId.toString());

    // Crear el directorio si no existe
    fs.mkdir(dir, { recursive: true }, (err) => {
      if (err) {
        return cb(err, null);
      }
      cb(null, dir);
    });
  },
  filename: (req, file, cb) => {
    // Usar un nombre de archivo predecible basado en el campo (ej. 'headerLogo.png')
    const extension = path.extname(file.originalname);
    const fieldName = file.fieldname;
    cb(null, `${fieldName}${extension}`);
  },
});

const upload = multer({ storage });

export default upload;
