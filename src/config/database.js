/**
 * Configuración y Pool de Conexiones a PostgreSQL
 * Utiliza 'pg' (node-postgres) con soporte para variables de entorno y SSL.
 */

import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

let poolInstance = null;

/**
 * Obtiene o inicializa la instancia única del Pool de PostgreSQL.
 * @param {import('pg').PoolConfig} [customConfig]
 * @returns {import('pg').Pool}
 */
export const getPool = (customConfig = null) => {
  if (poolInstance && !customConfig) {
    return poolInstance;
  }

  const databaseUrl = process.env.DATABASE_URL;
  const useSsl = process.env.PGSSL === 'true' || (databaseUrl && (databaseUrl.includes('neon.tech') || databaseUrl.includes('supabase.co')));

  const defaultConfig = databaseUrl
    ? {
        connectionString: databaseUrl,
        ssl: useSsl ? { rejectUnauthorized: false } : false
      }
    : {
        host: process.env.PGHOST || 'localhost',
        port: Number(process.env.PGPORT) || 5432,
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || 'postgres',
        database: process.env.PGDATABASE || 'inventario_db',
        ssl: useSsl ? { rejectUnauthorized: false } : false
      };

  const pool = new Pool(customConfig || defaultConfig);

  pool.on('error', (err) => {
    console.error('[PostgreSQL] Error inesperado en cliente inactivo del pool:', err.message);
  });

  if (!customConfig) {
    poolInstance = pool;
  }

  return pool;
};

/**
 * Crea las tablas necesarias en PostgreSQL e inserta la semilla inicial.
 * @param {import('pg').Pool} pool
 */
export const inicializarBaseDeDatos = async (pool = null) => {
  const activePool = pool || getPool();

  const ddlQuery = `
    CREATE TABLE IF NOT EXISTS productos (
      id SERIAL PRIMARY KEY,
      sku VARCHAR(50) NOT NULL UNIQUE,
      nombre VARCHAR(150) NOT NULL,
      descripcion TEXT,
      categoria VARCHAR(60) NOT NULL,
      precio NUMERIC(12, 2) NOT NULL CHECK(precio >= 0),
      stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
      creado_en VARCHAR(50) NOT NULL,
      actualizado_en VARCHAR(50) NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_productos_sku ON productos(sku);
    CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);

    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      nombre VARCHAR(100) NOT NULL,
      rol VARCHAR(30) NOT NULL DEFAULT 'operador'
    );
  `;

  await activePool.query(ddlQuery);

  // Semilla de usuario administrador predeterminado si no existe
  const adminCheck = await activePool.query('SELECT id FROM usuarios WHERE username = $1', ['admin']);
  if (adminCheck.rows.length === 0) {
    await activePool.query(
      `INSERT INTO usuarios (username, password, nombre, rol) VALUES ($1, $2, $3, $4)`,
      ['admin', 'admin123', 'Administrador General', 'administrador']
    );
  }

  // Semilla de productos demostrativos si la tabla está vacía
  const countRes = await activePool.query('SELECT COUNT(*) as total FROM productos');
  const total = parseInt(countRes.rows[0]?.total || '0', 10);

  if (total === 0) {
    const ahora = new Date().toISOString();
    const insertSql = `
      INSERT INTO productos (sku, nombre, descripcion, categoria, precio, stock, creado_en, actualizado_en)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    await activePool.query(insertSql, ['LAP-PRO-16', 'Laptop Dell XPS 15', 'Intel i7 32GB RAM SSD 1TB', 'Computación', 1450.00, 12, ahora, ahora]);
    await activePool.query(insertSql, ['MON-4K-IPS', 'Monitor LG UltraFine 27"', '4K IPS HDR400 USB-C', 'Monitores', 420.50, 8, ahora, ahora]);
    await activePool.query(insertSql, ['TEC-MEC-RGB', 'Teclado Mecánico Keychron K2', 'Switches Gateron Brown inalámbrico', 'Periféricos', 89.90, 4, ahora, ahora]);
    await activePool.query(insertSql, ['MOU-ERG-WL', 'Mouse Logitech MX Master 3S', 'Ergonómico sensor 8000 DPI', 'Periféricos', 99.00, 15, ahora, ahora]);
  }
};

/**
 * Cierra todas las conexiones del pool (útil en pruebas y graceful shutdown).
 */
export const closeDatabase = async () => {
  if (poolInstance) {
    await poolInstance.end();
    poolInstance = null;
  }
};
