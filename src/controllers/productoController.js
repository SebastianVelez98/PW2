/**
 * Capa de Controladores: Productos (PostgreSQL)
 */

import { defaultProductoService } from '../services/productoService.js';
import { formatearRespuestaExito } from '../utils/pure/formatters.js';

export class ProductoController {
  /**
   * @param {import('../services/productoService.js').ProductoService} [productoService]
   */
  constructor(productoService = defaultProductoService) {
    this.productoService = productoService;
  }

  _getIo(req) {
    return req.app.get('io');
  }

  listar = async (req, res, next) => {
    try {
      const resultado = await this.productoService.listarProductos(req.query);
      return res.status(200).json(
        formatearRespuestaExito(resultado.productos, { metricas: resultado.metricas })
      );
    } catch (error) {
      return next(error);
    }
  };

  obtenerPorId = async (req, res, next) => {
    try {
      const producto = await this.productoService.obtenerPorId(Number(req.params.id));
      return res.status(200).json(formatearRespuestaExito(producto));
    } catch (error) {
      return next(error);
    }
  };

  crear = async (req, res, next) => {
    try {
      const resultado = await this.productoService.crearProducto(req.body);
      const io = this._getIo(req);

      if (io) {
        io.emit('producto:creado', resultado.producto);

        if (resultado.esStockBajo) {
          io.emit('alerta:stock_bajo', {
            tipo: 'STOCK_CRITICO',
            producto: resultado.producto,
            stockActual: resultado.producto.stock,
            mensaje: `El producto '${resultado.producto.nombre}' fue registrado con stock bajo (${resultado.producto.stock} unidades).`
          });
        }
      }

      return res.status(201).json(formatearRespuestaExito(resultado.producto));
    } catch (error) {
      return next(error);
    }
  };

  actualizar = async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const resultado = await this.productoService.actualizarProducto(id, req.body);
      const io = this._getIo(req);

      if (io) {
        io.emit('producto:actualizado', resultado.producto);

        if (resultado.esStockBajo) {
          io.emit('alerta:stock_bajo', {
            tipo: 'STOCK_CRITICO',
            producto: resultado.producto,
            stockActual: resultado.producto.stock,
            mensaje: `El producto '${resultado.producto.nombre}' ha alcanzado un nivel de stock bajo (${resultado.producto.stock} unidades).`
          });
        }
      }

      return res.status(200).json(formatearRespuestaExito(resultado.producto));
    } catch (error) {
      return next(error);
    }
  };

  eliminar = async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const resultado = await this.productoService.eliminarProducto(id);
      const io = this._getIo(req);

      if (io) {
        io.emit('producto:eliminado', {
          id,
          sku: resultado.sku,
          nombre: resultado.nombre
        });
      }

      return res.status(200).json(
        formatearRespuestaExito(resultado, { mensaje: 'Producto eliminado satisfactoriamente.' })
      );
    } catch (error) {
      return next(error);
    }
  };

  exportarCsv = async (req, res, next) => {
    try {
      const csvString = await this.productoService.exportarCsv();
      const filename = `inventario_${new Date().toISOString().slice(0, 10)}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      return res.status(200).send(csvString);
    } catch (error) {
      return next(error);
    }
  };
}

export const defaultProductoController = new ProductoController();
