/**
 * Jerarquía de Errores de Dominio para la API REST
 */

export class AppError extends Error {
  /**
   * @param {string} mensaje
   * @param {number} statusCode
   * @param {string} codigo
   * @param {Array<unknown>} [detalles=[]]
   */
  constructor(mensaje, statusCode = 500, codigo = 'INTERNAL_SERVER_ERROR', detalles = []) {
    super(mensaje);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.codigo = codigo;
    this.detalles = detalles;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(mensaje = 'Solicitud incorrecta', detalles = []) {
    super(mensaje, 400, 'BAD_REQUEST', detalles);
  }
}

export class UnauthorizedError extends AppError {
  constructor(mensaje = 'Autenticación requerida. Sesión no activa o inválida.') {
    super(mensaje, 401, 'UNAUTHORIZED', []);
  }
}

export class NotFoundError extends AppError {
  constructor(mensaje = 'Recurso no encontrado') {
    super(mensaje, 404, 'NOT_FOUND', []);
  }
}

export class ConflictError extends AppError {
  constructor(mensaje = 'Conflicto con el estado actual del recurso', codigo = 'RESOURCE_CONFLICT', detalles = []) {
    super(mensaje, 409, codigo, detalles);
  }
}

