/**
 * Capa de Repositorio: Acceso a Datos de Productos con PostgreSQL
 * Responsabilidad:
 * - Única capa que realiza operaciones de E/S contra PostgreSQL.
 * - Consultas parametrizadas posicionales seguras ($1, $2, ...) contra SQL Injection.
 */

import { getPool } from '../config/database.js';

export class ProductoRepository {
  /**
   * @param {import('pg').Pool} [pool]
   */
  constructor(pool = null) {
    this.pool = pool;
  }

  /**
   * @private
   */
  _getPool() {
    return this.pool || getPool();
  }

  /**
   * Normaliza los tipos numéricos retornados por el driver 'pg'.
   * @private
   */
  _mapearFila(fila) {
    if (!fila) return undefined;
    return {
      ...fila,
      id: Number(fila.id),
      precio: Number(fila.precio),
      stock: Number(fila.stock)
    };
  }

  /**
   * Obtiene todos los productos aplicando filtros opcionales de búsqueda y categoría.
   * @param {{ busqueda?: string, categoria?: string }} [filtros={}]
   * @returns {Promise<Array<Record<string, unknown>>>}
   */
  async findAll(filtros = {}) {
    const pool = this._getPool();
    const condiciones = [];
    const parametros = [];

    if (filtros.busqueda) {
      parametros.push(`%${filtros.busqueda}%`);
      const pos = parametros.length;
      condiciones.push(`(nombre ILIKE $${pos} OR sku ILIKE $${pos} OR descripcion ILIKE $${pos})`);
    }

    if (filtros.categoria) {
      parametros.push(filtros.categoria);
      const pos = parametros.length;
      condiciones.push(`categoria = $${pos}`);
    }

    const whereClause = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
    const sql = `
      SELECT id, sku, nombre, descripcion, categoria, precio, stock, creado_en, actualizado_en
      FROM productos
      ${whereClause}
      ORDER BY id DESC
    `;

    const res = await pool.query(sql, parametros);
    return res.rows.map(this._mapearFila);
  }

  /**
   * Busca un producto por ID.
   * @param {number} id
   * @returns {Promise<Record<string, unknown>|undefined>}
   */
  async findById(id) {
    const pool = this._getPool();
    const sql = `
      SELECT id, sku, nombre, descripcion, categoria, precio, stock, creado_en, actualizado_en
      FROM productos
      WHERE id = $1
    `;
    const res = await pool.query(sql, [Number(id)]);
    return this._mapearFila(res.rows[0]);
  }

  /**
   * Busca un producto por su código SKU único.
   * @param {string} sku
   * @returns {Promise<Record<string, unknown>|undefined>}
   */
  async findBySku(sku) {
    const pool = this._getPool();
    const sql = `
      SELECT id, sku, nombre, descripcion, categoria, precio, stock, creado_en, actualizado_en
      FROM productos
      WHERE UPPER(sku) = UPPER($1)
    `;
    const res = await pool.query(sql, [String(sku).trim()]);
    return this._mapearFila(res.rows[0]);
  }

  /**
   * Inserta un nuevo producto usando consulta parametrizada con RETURNING *.
   * @param {{
   *   sku: string,
   *   nombre: string,
   *   descripcion: string,
   *   categoria: string,
   *   precio: number,
   *   stock: number,
   *   creado_en: string,
   *   actualizado_en: string
   * }} producto
   * @returns {Promise<Record<string, unknown>>}
   */
  async create(producto) {
    const pool = this._getPool();
    const sql = `
      INSERT INTO productos (sku, nombre, descripcion, categoria, precio, stock, creado_en, actualizado_en)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, sku, nombre, descripcion, categoria, precio, stock, creado_en, actualizado_en
    `;

    const res = await pool.query(sql, [
      producto.sku,
      producto.nombre,
      producto.descripcion,
      producto.categoria,
      producto.precio,
      producto.stock,
      producto.creado_en,
      producto.actualizado_en
    ]);

    return this._mapearFila(res.rows[0]);
  }

  /**
   * Actualiza un producto existente por su ID.
   * @param {number} id
   * @param {Record<string, unknown>} producto
   * @returns {Promise<Record<string, unknown>|undefined>}
   */
  async update(id, producto) {
    const pool = this._getPool();
    const sql = `
      UPDATE productos
      SET sku = $1,
          nombre = $2,
          descripcion = $3,
          categoria = $4,
          precio = $5,
          stock = $6,
          actualizado_en = $7
      WHERE id = $8
      RETURNING id, sku, nombre, descripcion, categoria, precio, stock, creado_en, actualizado_en
    `;

    const res = await pool.query(sql, [
      producto.sku,
      producto.nombre,
      producto.descripcion,
      producto.categoria,
      producto.precio,
      producto.stock,
      producto.actualizado_en,
      Number(id)
    ]);

    return this._mapearFila(res.rows[0]);
  }

  /**
   * Elimina un producto por ID.
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async deleteById(id) {
    const pool = this._getPool();
    const res = await pool.query('DELETE FROM productos WHERE id = $1', [Number(id)]);
    return res.rowCount > 0;
  }

  /**
   * Conteo total de registros en la tabla.
   * @returns {Promise<number>}
   */
  async count() {
    const pool = this._getPool();
    const res = await pool.query('SELECT COUNT(*) as total FROM productos');
    return parseInt(res.rows[0]?.total || '0', 10);
  }
}

export const defaultProductoRepository = new ProductoRepository();
