/**
 * Middleware de Validación con Zod
 * Valida el cuerpo, parámetros o queries de la solicitud HTTP.
 */

import { formatearRespuestaError } from '../utils/pure/formatters.js';

/**
 * Genera un middleware para validar `req.body` contra un esquema Zod.
 * @param {import('zod').ZodSchema} schema
 * @param {'body' | 'query' | 'params'} [target='body']
 */
export const validarEsquema = (schema, target = 'body') => {
  return (req, res, next) => {
    const resultado = schema.safeParse(req[target]);

    if (!resultado.success) {
      const detalles = resultado.error.issues.map((issue) => ({
        campo: issue.path.join('.'),
        mensaje: issue.message,
        codigo: issue.code
      }));

      const respuestaError = formatearRespuestaError(
        'VALIDACION_FALLIDA',
        'Uno o más campos enviados son inválidos o faltantes.',
        detalles
      );

      return res.status(400).json(respuestaError);
    }

    // Reemplaza con los datos tipados y limpios de Zod
    req[target] = resultado.data;
    return next();
  };
};

