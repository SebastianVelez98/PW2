/**
 * Capa de Servicios: Orquestación del Negocio de Productos (PostgreSQL)
 * Principios:
 * - Orquesta operaciones asíncronas de repositorio con transformaciones puras.
 * - Prohibida la mutación directa de objetos (uso de spread operator, map, filter, etc.).
 * - Reglas de negocio y generación de errores de dominio (404, 409).
 */

import { defaultProductoRepository } from '../repositories/productoRepository.js';
import { sanitizarPayloadProducto } from '../utils/pure/normalizers.js';
import {
  calcularMetricasInventario,
  evaluarStockBajo
} from '../utils/pure/inventoryCalculations.js';
import {
  enriquecerProducto,
  enriquecerListaProductos
} from '../utils/pure/businessRules.js';
import { convertirAFormatoCsv } from '../utils/pure/formatters.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

export class ProductoService {
  /**
   * @param {import('../repositories/productoRepository.js').ProductoRepository} [productoRepo]
   */
  constructor(productoRepo = defaultProductoRepository) {
    this.productoRepo = productoRepo;
  }

  /**
   * Obtiene la lista de productos filtrada y enriquecida con métricas de inventario.
   * @param {{ busqueda?: string, categoria?: string }} [filtros={}]
   */
  async listarProductos(filtros = {}) {
    const productosRaw = await this.productoRepo.findAll(filtros);

    // Transformación funcional pura sin mutaciones
    const productosEnriquecidos = enriquecerListaProductos(productosRaw);
    const metricas = calcularMetricasInventario(productosRaw);

    return Object.freeze({
      productos: productosEnriquecidos,
      metricas
    });
  }

  /**
   * Obtiene un producto por su ID.
   * @param {number} id
   */
  async obtenerPorId(id) {
    const productoRaw = await this.productoRepo.findById(id);

    if (!productoRaw) {
      throw new NotFoundError(`Producto con ID ${id} no encontrado en el sistema.`);
    }

    return enriquecerProducto(productoRaw);
  }

  /**
   * Crea un nuevo producto validando unicidad de SKU y evaluando alertas de stock.
   * @param {Record<string, unknown>} payload
   * @param {string} [timestamp]
   */
  async crearProducto(payload, timestamp = new Date().toISOString()) {
    // Normalización pura
    const datosNormalizados = sanitizarPayloadProducto(payload);

    // Verificación de unicidad de SKU (Evitar conflicto 409)
    const existente = await this.productoRepo.findBySku(datosNormalizados.sku);
    if (existente) {
      throw new ConflictError(
        `Conflicto de integridad: El producto con código SKU '${datosNormalizados.sku}' ya existe.`,
        'SKU_DUPLICADO',
        [{ campo: 'sku', valor: datosNormalizados.sku }]
      );
    }

    // Creación inmutable de la entidad para el repositorio
    const entidadParaGuardar = Object.freeze({
      ...datosNormalizados,
      creado_en: timestamp,
      actualizado_en: timestamp
    });

    const productoCreado = await this.productoRepo.create(entidadParaGuardar);
    const esStockBajo = evaluarStockBajo(productoCreado.stock, 5);

    return Object.freeze({
      producto: enriquecerProducto(productoCreado),
      esStockBajo
    });
  }

  /**
   * Actualiza un producto existente asegurando inmutabilidad y chequeo de SKU repetido.
   * @param {number} id
   * @param {Record<string, unknown>} payload
   * @param {string} [timestamp]
   */
  async actualizarProducto(id, payload, timestamp = new Date().toISOString()) {
    const productoActual = await this.productoRepo.findById(id);

    if (!productoActual) {
      throw new NotFoundError(`No se puede actualizar: Producto con ID ${id} no existe.`);
    }

    const datosNormalizados = sanitizarPayloadProducto(payload);

    // Si el SKU cambia, verificar que no colisione con otro producto
    if (datosNormalizados.sku !== productoActual.sku) {
      const otroConMismoSku = await this.productoRepo.findBySku(datosNormalizados.sku);
      if (otroConMismoSku && otroConMismoSku.id !== Number(id)) {
        throw new ConflictError(
          `Conflicto de integridad: El SKU '${datosNormalizados.sku}' ya está asignado a otro producto (ID: ${otroConMismoSku.id}).`,
          'SKU_DUPLICADO',
          [{ campo: 'sku', valor: datosNormalizados.sku }]
        );
      }
    }

    // Nuevo estado inmutable
    const entidadActualizada = Object.freeze({
      ...productoActual,
      ...datosNormalizados,
      actualizado_en: timestamp
    });

    const resultado = await this.productoRepo.update(id, entidadActualizada);
    const esStockBajo = evaluarStockBajo(resultado.stock, 5);

    return Object.freeze({
      producto: enriquecerProducto(resultado),
      esStockBajo
    });
  }

  /**
   * Elimina un producto por ID si existe.
   * @param {number} id
   */
  async eliminarProducto(id) {
    const productoActual = await this.productoRepo.findById(id);

    if (!productoActual) {
      throw new NotFoundError(`No se puede eliminar: Producto con ID ${id} no existe.`);
    }

    await this.productoRepo.deleteById(id);

    return Object.freeze({
      ...productoActual
    });
  }

  /**
   * Exporta todo el catálogo en formato CSV usando transformación funcional pura.
   */
  async exportarCsv() {
    const todos = await this.productoRepo.findAll();
    return convertirAFormatoCsv(todos);
  }
}

export const defaultProductoService = new ProductoService();
