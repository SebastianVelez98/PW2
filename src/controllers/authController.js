/**
 * Capa de Controladores: Autenticación y Sesiones (PostgreSQL)
 */

import { defaultAuthService } from '../services/authService.js';
import { formatearRespuestaExito, formatearRespuestaError } from '../utils/pure/formatters.js';

export class AuthController {
  /**
   * @param {import('../services/authService.js').AuthService} [authService]
   */
  constructor(authService = defaultAuthService) {
    this.authService = authService;
  }

  login = async (req, res, next) => {
    try {
      const { username, password } = req.body;
      const usuario = await this.authService.autenticar(username, password);

      req.session.usuario = usuario;

      return res.status(200).json(
        formatearRespuestaExito(usuario, {
          mensaje: 'Autenticación exitosa. Sesión iniciada.'
        })
      );
    } catch (error) {
      return next(error);
    }
  };

  logout = (req, res, next) => {
    if (!req.session) {
      return res.status(200).json(
        formatearRespuestaExito({ autenticado: false }, { mensaje: 'No existía sesión activa.' })
      );
    }

    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }
      res.clearCookie('connect.sid');
      return res.status(200).json(
        formatearRespuestaExito({ autenticado: false }, {
          mensaje: 'Sesión cerrada correctamente.'
        })
      );
    });
  };

  me = (req, res) => {
    if (!req.session || !req.session.usuario) {
      const errorNoAuth = formatearRespuestaError(
        'NO_AUTORIZADO',
        'No hay una sesión activa.',
        []
      );
      return res.status(401).json(errorNoAuth);
    }

    return res.status(200).json(
      formatearRespuestaExito(req.session.usuario, { activo: true })
    );
  };
}

export const defaultAuthController = new AuthController();
