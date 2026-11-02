/**
 * Capa de Servicios: Autenticación y Manejo de Sesiones (PostgreSQL)
 */

import { defaultUsuarioRepository } from '../repositories/usuarioRepository.js';
import { UnauthorizedError } from '../utils/errors.js';

export class AuthService {
  /**
   * @param {import('../repositories/usuarioRepository.js').UsuarioRepository} [usuarioRepo]
   */
  constructor(usuarioRepo = defaultUsuarioRepository) {
    this.usuarioRepo = usuarioRepo;
  }

  /**
   * Valida credenciales de acceso contra PostgreSQL.
   * @param {string} username
   * @param {string} password
   */
  async autenticar(username, password) {
    if (!username || !password) {
      throw new UnauthorizedError('Credenciales incompletas.');
    }

    const usuario = await this.usuarioRepo.findByUsername(username);

    if (!usuario || usuario.password !== password) {
      throw new UnauthorizedError('Credenciales inválidas. Usuario o contraseña incorrectos.');
    }

    return Object.freeze({
      id: usuario.id,
      username: usuario.username,
      nombre: usuario.nombre,
      rol: usuario.rol
    });
  }
}

export const defaultAuthService = new AuthService();
