/**
 * Punto de Entrada del Servidor: HTTP + Socket.io + PostgreSQL
 */

import 'dotenv/config';
import { createServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app.js';
import { getPool, inicializarBaseDeDatos, closeDatabase } from './config/database.js';

const PORT = process.env.PORT || 3000;

const app = createApp();
const httpServer = createServer(app);

// Inicialización de Socket.io acoplado al servidor HTTP
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Guardamos la instancia de io en la app de Express para inyección en los controladores
app.set('io', io);

io.on('connection', (socket) => {
  socket.emit('sistema:bienvenida', {
    mensaje: 'Conexión WebSocket establecida con el servidor PostgreSQL.',
    timestamp: new Date().toISOString()
  });
});

// Inicio del servidor e inicialización de PostgreSQL
const iniciarServidor = async () => {
  try {
    getPool();
    console.log('[PostgreSQL] Conectando y verificando tablas...');
    await inicializarBaseDeDatos();
    console.log('[PostgreSQL] Tablas e índices sincronizados exitosamente.');
  } catch (err) {
    console.warn('[PostgreSQL Advertencia]: No se pudo conectar a PostgreSQL al arrancar.');
    console.warn(`[Detalle]: ${err.message}`);
    console.warn('[Acción]: Asegúrate de que PostgreSQL esté corriendo y revisa la configuración en tu archivo .env');
  }

  if (process.env.NODE_ENV !== 'test') {
    httpServer.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(` API REST de Gestión de Inventario lista y activa`);
      console.log(` Motor BD       : PostgreSQL`);
      console.log(` URL Servidor   : http://localhost:${PORT}`);
      console.log(` Dashboard Live : http://localhost:${PORT}/`);
      console.log(` Configuración  : Archivo .env`);
      console.log(`====================================================`);
    });
  }
};

iniciarServidor();

// Cierre elegante (Graceful Shutdown)
const handleShutdown = async (signal) => {
  console.log(`\n[${signal}] Cerrando servidor y conexiones de PostgreSQL...`);
  io.close();
  httpServer.close(async () => {
    await closeDatabase();
    console.log('[Sistema] Conexiones finalizadas exitosamente.');
    process.exit(0);
  });
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

export { app, httpServer, io };
