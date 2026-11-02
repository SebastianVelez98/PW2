/**
 * Módulo de Transformaciones Puras: Formateadores de Respuestas y Archivos
 * Principios:
 * - Sin efectos colaterales.
 * - Reciben fecha o timestamp de forma explícita para garantizar reproducibilidad en pruebas.
 */

/**
 * Formatea una respuesta exitosa uniforme para la API REST.
 * @param {unknown} data - Carga útil de datos
 * @param {Record<string, unknown>|null} [meta=null] - Metadatos opcionales (paginación, métricas)
 * @returns {Readonly<{ ok: true, data: unknown, meta?: Record<string, unknown> }>}
 */
export const formatearRespuestaExito = (data, meta = null) => {
  const payload = {
    ok: true,
    data,
    ...(meta ? { meta } : {})
  };
  return Object.freeze(payload);
};

/**
 * Formatea una respuesta de error uniforme siguiendo la especificación estricta:
 * { "ok": false, "error": { "codigo": "...", "mensaje": "...", "detalles": [] }, "timestamp": "..." }
 * @param {string} codigo - Código de error de dominio (ej. SKU_DUPLICADO, VALIDATION_ERROR)
 * @param {string} mensaje - Descripción legible del error
 * @param {Array<unknown>} [detalles=[]] - Lista detallada de fallos (ej. validaciones de campo)
 * @param {string} [timestamp] - Marca de tiempo ISO inyectada
 * @returns {Readonly<{
 *   ok: false,
 *   error: { codigo: string, mensaje: string, detalles: Array<unknown> },
 *   timestamp: string
 * }>}
 */
export const formatearRespuestaError = (codigo, mensaje, detalles = [], timestamp = null) => {
  return Object.freeze({
    ok: false,
    error: {
      codigo: String(codigo),
      mensaje: String(mensaje),
      detalles: Array.isArray(detalles) ? [...detalles] : [detalles]
    },
    timestamp: timestamp || new Date().toISOString()
  });
};

/**
 * Escapa valores para formato CSV cumpliendo con RFC 4180.
 * @param {unknown} valor
 * @returns {string}
 */
export const escaparCampoCsv = (valor) => {
  if (valor === null || valor === undefined) return '""';
  const str = String(valor);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
};

/**
 * Convierte un arreglo de productos a un string con formato CSV puro.
 * @param {Array<Record<string, unknown>>} productos
 * @returns {string}
 */
export const convertirAFormatoCsv = (productos) => {
  if (!Array.isArray(productos) || productos.length === 0) {
    return 'ID,SKU,Nombre,Descripcion,Categoria,Precio,Stock,CreadoEn,ActualizadoEn\n';
  }

  const cabeceras = ['ID', 'SKU', 'Nombre', 'Descripcion', 'Categoria', 'Precio', 'Stock', 'CreadoEn', 'ActualizadoEn'];
  
  const filas = productos.map((p) => [
    escaparCampoCsv(p.id),
    escaparCampoCsv(p.sku),
    escaparCampoCsv(p.nombre),
    escaparCampoCsv(p.descripcion ?? ''),
    escaparCampoCsv(p.categoria),
    escaparCampoCsv(p.precio),
    escaparCampoCsv(p.stock),
    escaparCampoCsv(p.creado_en),
    escaparCampoCsv(p.actualizado_en)
  ].join(','));

  return [cabeceras.join(','), ...filas].join('\r\n') + '\r\n';
};

