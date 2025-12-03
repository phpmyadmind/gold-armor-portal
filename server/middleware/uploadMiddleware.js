import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Configuración de almacenamiento unificada para Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/'; // Directorio base

    // Personaliza la ruta de subida según el parámetro de la URL
    if (req.params.eventId) {
      // Los archivos de un evento van a /uploads/{eventId}/
      uploadPath = path.join(uploadPath, req.params.eventId.toString());
    } else if (req.params.stationId) {
      // Los archivos de una estación van a /uploads/stations/{stationId}/
      uploadPath = path.join(uploadPath, 'stations', req.params.stationId.toString());
    } else {
      // Si no se encuentra un ID, no se puede determinar el destino
      return cb(new Error('No se pudo determinar el destino de la subida: falta eventId o stationId.'), null);
    }

    // Asegurarse de que el directorio de destino exista
    fs.mkdir(uploadPath, { recursive: true }, (err) => {
      if (err) {
        return cb(err, null);
      }
      cb(null, uploadPath);
    });
  },
  filename: (req, file, cb) => {
    // Usar un nombre de archivo predecible y consistente basado en el campo del formulario
    const extension = path.extname(file.originalname);
    const fieldName = file.fieldname; // ej: 'bodyBgImage', 'headerLogo', 'backgroundImage'
    cb(null, `${fieldName}${extension}`);
  },
});

// Crear la instancia de Multer con la configuración de almacenamiento
const upload = multer({ storage });

export default upload;
