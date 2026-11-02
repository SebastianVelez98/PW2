/**
 * Middleware de Control de Acceso por Sesión
 * Protege rutas que requieren autenticación previa mediante express-session.
 */

import { formatearRespuestaError } from '../utils/pure/formatters.js';

export const verificarSesion = (req, res, next) => {
  if (!req.session || !req.session.usuario) {
    const errorFormateado = formatearRespuestaError(
      'NO_AUTORIZADO',
      'Acceso denegado: Se requiere una sesión activa para ejecutar esta acción.',
      []
    );
    return res.status(401).json(errorFormateado);
  }

  return next();
};

