/**
 * Módulo de Transformaciones Puras: Cálculos de Inventario
 * Principios:
 * - Deterministas (mismos inputs -> mismos outputs).
 * - Cero efectos secundarios (sin mutaciones, sin I/O, sin dependencias de tiempo del sistema).
 */

/**
 * Calcula el valor total monetario del stock para una lista de productos.
 * @param {Array<{ precio: number, stock: number }>} productos
 * @returns {number}
 */
export const calcularValorTotalStock = (productos) => {
  if (!Array.isArray(productos)) return 0;

  const total = productos.reduce((acumulador, item) => {
    const precio = Number(item?.precio) || 0;
    const stock = Number(item?.stock) || 0;
    return acumulador + precio * stock;
  }, 0);

  return Number(total.toFixed(2));
};

/**
 * Calcula el impuesto para un precio dado.
 * @param {number} precio
 * @param {number} [tasa=0.15] - Tasa de impuesto (por defecto 15% IVA)
 * @returns {number}
 */
export const calcularImpuesto = (precio, tasa = 0.15) => {
  const monto = Number(precio) || 0;
  if (monto <= 0) return 0;
  return Number((monto * tasa).toFixed(2));
};

/**
 * Calcula el precio final incluyendo impuestos.
 * @param {number} precio
 * @param {number} [tasa=0.15]
 * @returns {number}
 */
export const calcularPrecioConImpuesto = (precio, tasa = 0.15) => {
  const monto = Number(precio) || 0;
  const impuesto = calcularImpuesto(monto, tasa);
  return Number((monto + impuesto).toFixed(2));
};

/**
 * Evalúa si una cantidad de stock se encuentra por debajo del umbral mínimo.
 * @param {number} stock
 * @param {number} [umbral=5]
 * @returns {boolean}
 */
export const evaluarStockBajo = (stock, umbral = 5) => {
  const cantidad = Number(stock);
  if (Number.isNaN(cantidad)) return false;
  return cantidad <= umbral;
};

/**
 * Genera métricas consolidadas de un conjunto de productos sin mutar el array original.
 * @param {Array<{ id: number, precio: number, stock: number }>} productos
 * @param {number} [umbralStockBajo=5]
 * @returns {{
 *   totalProductos: number,
 *   totalUnidades: number,
 *   valorTotalInventario: number,
 *   productosConStockBajo: number
 * }}
 */
export const calcularMetricasInventario = (productos, umbralStockBajo = 5) => {
  if (!Array.isArray(productos)) {
    return Object.freeze({
      totalProductos: 0,
      totalUnidades: 0,
      valorTotalInventario: 0,
      productosConStockBajo: 0
    });
  }

  const metricas = productos.reduce(
    (acum, producto) => {
      const stock = Number(producto.stock) || 0;
      const precio = Number(producto.precio) || 0;
      const esBajo = evaluarStockBajo(stock, umbralStockBajo);

      return {
        totalProductos: acum.totalProductos + 1,
        totalUnidades: acum.totalUnidades + stock,
        valorTotalInventario: acum.valorTotalInventario + stock * precio,
        productosConStockBajo: acum.productosConStockBajo + (esBajo ? 1 : 0)
      };
    },
    { totalProductos: 0, totalUnidades: 0, valorTotalInventario: 0, productosConStockBajo: 0 }
  );

  return Object.freeze({
    totalProductos: metricas.totalProductos,
    totalUnidades: metricas.totalUnidades,
    valorTotalInventario: Number(metricas.valorTotalInventario.toFixed(2)),
    productosConStockBajo: metricas.productosConStockBajo
  });
};

