/**
 * Rutas de Autenticación y Manejo de Sesiones
 */

import { Router } from 'express';
import { defaultAuthController } from '../controllers/authController.js';
import { validarEsquema } from '../middlewares/validateMiddleware.js';
import { loginSchema } from '../schemas/authSchema.js';

const router = Router();

router.post('/login', validarEsquema(loginSchema, 'body'), defaultAuthController.login);
router.post('/logout', defaultAuthController.logout);
router.get('/me', defaultAuthController.me);

export default router;

