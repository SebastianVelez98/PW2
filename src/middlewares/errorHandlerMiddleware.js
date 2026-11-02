/**
 * Middleware Global de Manejo Uniforme de Errores (PostgreSQL + Dominio)
 */

import { AppError } from '../utils/errors.js';
import { formatearRespuestaError } from '../utils/pure/formatters.js';

export const errorHandler = (err, req, res, next) => {
  // Manejo de errores de sintaxis JSON en el body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    const errorBody = formatearRespuestaError(
      'JSON_INVALIDO',
      'El cuerpo de la solicitud no contiene un formato JSON válido.',
      [{ mensaje: err.message }]
    );
    return res.status(400).json(errorBody);
  }

  // Manejo de colisiones de clave única en PostgreSQL (23505) o SQLite
  if (err.code === '23505' || err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    const errorConflict = formatearRespuestaError(
      'SKU_DUPLICADO',
      'Conflicto de unicidad: Ya existe un registro con el mismo código SKU.',
      [{ mensaje: err.detail || err.message }]
    );
    return res.status(409).json(errorConflict);
  }

  // Manejo de error de conexión a la base de datos PostgreSQL
  if (err.code === 'ECONNREFUSED' || err.code === '28P01' || err.code === '3D000') {
    console.error('[PostgreSQL Error de Conexión]:', err.message);
    const errorDb = formatearRespuestaError(
      'DATABASE_CONNECTION_ERROR',
      'No se pudo establecer conexión con el servidor PostgreSQL. Verifica las credenciales en .env.',
      [{ codigoPostgres: err.code, mensaje: err.message }]
    );
    return res.status(500).json(errorDb);
  }

  // Manejo de errores de dominio (AppError)
  if (err instanceof AppError) {
    const errorFormateado = formatearRespuestaError(
      err.codigo,
      err.message,
      err.detalles
    );
    return res.status(err.statusCode).json(errorFormateado);
  }

  // Errores imprevistos del servidor (500)
  console.error('[Error 500 no controlado]:', err);

  const errorInesperado = formatearRespuestaError(
    'INTERNAL_SERVER_ERROR',
    'Ha ocurrido un error interno e inesperado en el servidor.',
    process.env.NODE_ENV === 'development' ? [{ stack: err.stack, mensaje: err.message }] : []
  );

  return res.status(500).json(errorInesperado);
};
