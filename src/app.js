/**
 * Configuración Principal de la Aplicación Express
 */

import express from 'express';
import session from 'express-session';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import productoRoutes from './routes/productoRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { errorHandler } from './middlewares/errorHandlerMiddleware.js';
import { formatearRespuestaError } from './utils/pure/formatters.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createApp = (sessionConfig = {}) => {
  const app = express();

  // Middlewares de parseo y CORS
  app.use(cors({
    origin: true,
    credentials: true
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Archivos estáticos para la vista de monitoreo en tiempo real
  app.use(express.static(path.join(__dirname, '../public')));

  // Configuración de Sesiones con express-session
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'clave_secreta_arquitectura_inventario_2026',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 8, // 8 horas
        sameSite: 'lax'
      },
      ...sessionConfig
    })
  );

  // Registro de Rutas de la API REST
  app.use('/api/auth', authRoutes);
  app.use('/api/productos', productoRoutes);

  // Ruta raíz: redirige a la vista de monitoreo en tiempo real
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });

  // Manejador para endpoints no existentes (404 estricto)
  app.use((req, res) => {
    const error404 = formatearRespuestaError(
      'RUTA_NO_ENCONTRADA',
      `El endpoint solicitado '${req.method} ${req.originalUrl}' no existe en esta API.`,
      []
    );
    return res.status(404).json(error404);
  });

  // Middleware global de errores
  app.use(errorHandler);

  return app;
};

