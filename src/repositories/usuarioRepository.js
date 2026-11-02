/**
 * Capa de Repositorio: Acceso a Datos de Usuarios con PostgreSQL
 */

import { getPool } from '../config/database.js';

export class UsuarioRepository {
  /**
   * @param {import('pg').Pool} [pool]
   */
  constructor(pool = null) {
    this.pool = pool;
  }

  _getPool() {
    return this.pool || getPool();
  }

  /**
   * Busca un usuario por su nombre de usuario con parámetros seguros.
   * @param {string} username
   * @returns {Promise<Record<string, unknown>|undefined>}
   */
  async findByUsername(username) {
    const pool = this._getPool();
    const res = await pool.query(
      `SELECT id, username, password, nombre, rol FROM usuarios WHERE username = $1`,
      [String(username).trim()]
    );
    return res.rows[0];
  }

  /**
   * Busca un usuario por ID.
   * @param {number} id
   * @returns {Promise<Record<string, unknown>|undefined>}
   */
  async findById(id) {
    const pool = this._getPool();
    const res = await pool.query(
      `SELECT id, username, nombre, rol FROM usuarios WHERE id = $1`,
      [Number(id)]
    );
    return res.rows[0];
  }
}

export const defaultUsuarioRepository = new UsuarioRepository();
