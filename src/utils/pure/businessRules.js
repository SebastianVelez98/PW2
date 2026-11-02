/**
 * Módulo de Transformaciones Puras: Reglas de Negocio de Dominio
 * Principios:
 * - Operaciones funcionales sobre estructuras de datos.
 * - Inmutabilidad absoluta.
 */

import { evaluarStockBajo, calcularImpuesto, calcularPrecioConImpuesto } from './inventoryCalculations.js';

/**
 * Clasifica el nivel de stock de un producto.
 * @param {number} stock
 * @returns {'AGOTADO' | 'CRITICO' | 'BAJO' | 'OPTIMO'}
 */
export const clasificarEstadoStock = (stock) => {
  const cantidad = Number(stock) || 0;
  if (cantidad <= 0) return 'AGOTADO';
  if (cantidad <= 2) return 'CRITICO';
  if (cantidad <= 5) return 'BAJO';
  return 'OPTIMO';
};

/**
 * Enriquece un producto con cálculos derivados (impuestos, clasificación de stock)
 * garantizando que el objeto resultante sea una nueva referencia inmutable.
 * @param {Record<string, unknown>} producto
 * @returns {Readonly<Record<string, unknown>>}
 */
export const enriquecerProducto = (producto) => {
  if (!producto || typeof producto !== 'object') return Object.freeze({});

  const stock = Number(producto.stock) || 0;
  const precio = Number(producto.precio) || 0;
  const impuesto = calcularImpuesto(precio);
  const precioTotal = calcularPrecioConImpuesto(precio);
  const estadoStock = clasificarEstadoStock(stock);
  const requiereAlertaStock = evaluarStockBajo(stock, 5);

  return Object.freeze({
    ...producto,
    calculos: Object.freeze({
      impuesto,
      precioTotal,
      estadoStock,
      requiereAlertaStock
    })
  });
};

/**
 * Proyecta y enriquece una lista de productos usando programación funcional.
 * @param {Array<Record<string, unknown>>} productos
 * @returns {ReadonlyArray<Readonly<Record<string, unknown>>>}
 */
export const enriquecerListaProductos = (productos) => {
  if (!Array.isArray(productos)) return Object.freeze([]);
  return Object.freeze(productos.map(enriquecerProducto));
};

