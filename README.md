# Armaduras de Oro - Portal de Gestión de Eventos

Aplicación React con backend Node.js para gestión de eventos, trivias y métricas en tiempo real.

## Características

- ✅ Sistema de autenticación con roles (Usuario, Admin, Speaker, Director)
- ✅ Gestión completa de eventos
- ✅ Sistema de estaciones y trivias interactivas
- ✅ Dashboard en tiempo real para directores
- ✅ Exportación de datos a Excel y PDF
- ✅ Códigos QR en todas las vistas
- ✅ Diseño responsive con tema medieval

## Tecnologías

### Frontend
- React 18
- React Router
- Tailwind CSS
- Recharts (gráficos)
- QRCode React

### Backend
- Node.js + Express
- MySQL2
- JWT para autenticación
- Bcrypt para contraseñas

## Instalación

### Frontend
```bash
npm install
npm run dev
```

### Backend
```bash
cd server
npm install
npm start
```

## Configuración

Las credenciales de la base de datos están configuradas en `server/.env`:

```
DB_HOST=179.50.79.19
DB_USER=root
DB_PASSWORD=Pcn123456!
DB_NAME=gold-armor-surveys
DB_PORT=3306
JWT_SECRET=476499bb-af5b-4dfd-a8b4-92c032c51e64
PORT=5000
```

La aplicación creará automáticamente las tablas necesarias al iniciar el servidor.

## Roles y Permisos

- **Usuario**: Participar en trivias, ver estaciones
- **Admin**: Gestión completa (eventos, usuarios, trivias)
- **Speaker/Staff**: Ver preguntas asociadas
- **Director**: Dashboard de métricas (sin autenticación requerida)

## Estructura del Proyecto

```
gold-armor-portal/
├── src/
│   ├── components/     # Componentes reutilizables
│   ├── pages/          # Páginas de la aplicación
│   ├── contexts/       # Contextos de React
│   └── services/       # Servicios API
├── server/
│   ├── routes/         # Rutas de la API
│   ├── middleware/     # Middleware de autenticación
│   └── config/         # Configuración de BD
└── public/             # Archivos estáticos
```

## Rutas Principales

- `/` - Página de inicio
- `/login` - Iniciar sesión
- `/register` - Registro de usuarios
- `/stations` - Lista de estaciones
- `/station/:id` - Detalle de estación
- `/quiz/:stationId` - Quiz interactivo
- `/admin` - Panel de administración
- `/director` - Dashboard de director

