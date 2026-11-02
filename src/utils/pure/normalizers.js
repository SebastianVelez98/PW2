/**
 * Módulo de Transformaciones Puras: Normalizadores de Texto y Datos
 * Principios:
 * - Sin efectos colaterales.
 * - Siempre retorna nuevos strings u objetos inmutables.
 */

/**
 * Normaliza un código SKU (elimina espacios residuales y convierte a mayúsculas).
 * @param {string} sku
 * @returns {string}
 */
export const normalizarSku = (sku) => {
  if (typeof sku !== 'string') return '';
  return sku.trim().toUpperCase().replace(/\s+/g, '-');
};

/**
 * Normaliza campos de texto colapsando espacios múltiples.
 * @param {string} texto
 * @returns {string}
 */
export const normalizarTexto = (texto) => {
  if (typeof texto !== 'string') return '';
  return texto.trim().replace(/\s+/g, ' ');
};

/**
 * Sanitiza y crea una copia pura del payload de producto, normalizando sus valores.
 * @param {Record<string, unknown>} payload
 * @returns {Readonly<{
 *   sku: string,
 *   nombre: string,
 *   descripcion: string,
 *   categoria: string,
 *   precio: number,
 *   stock: number
 * }>}
 */
export const sanitizarPayloadProducto = (payload = {}) => {
  const sanitized = {
    sku: normalizarSku(payload.sku ?? ''),
    nombre: normalizarTexto(payload.nombre ?? ''),
    descripcion: normalizarTexto(payload.descripcion ?? ''),
    categoria: normalizarTexto(payload.categoria ?? ''),
    precio: Number(Number(payload.precio ?? 0).toFixed(2)),
    stock: Math.max(0, Math.floor(Number(payload.stock ?? 0)))
  };

  return Object.freeze(sanitized);
};

