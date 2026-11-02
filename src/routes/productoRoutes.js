/**
 * Rutas REST para Gestión de Productos
 */

import { Router } from 'express';
import { defaultProductoController } from '../controllers/productoController.js';
import { verificarSesion } from '../middlewares/authMiddleware.js';
import { validarEsquema } from '../middlewares/validateMiddleware.js';
import {
  crearProductoSchema,
  actualizarProductoSchema,
  consultaProductosSchema
} from '../schemas/productoSchema.js';

const router = Router();

// Rutas de lectura y exportación
router.get(
  '/',
  validarEsquema(consultaProductosSchema, 'query'),
  defaultProductoController.listar
);

router.get(
  '/exportar/csv',
  defaultProductoController.exportarCsv
);

router.get(
  '/:id',
  defaultProductoController.obtenerPorId
);

// Rutas protegidas por sesión que modifican estado
router.post(
  '/',
  verificarSesion,
  validarEsquema(crearProductoSchema, 'body'),
  defaultProductoController.crear
);

router.put(
  '/:id',
  verificarSesion,
  validarEsquema(actualizarProductoSchema, 'body'),
  defaultProductoController.actualizar
);

router.delete(
  '/:id',
  verificarSesion,
  defaultProductoController.eliminar
);

export default router;

