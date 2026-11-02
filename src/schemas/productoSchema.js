import { z } from 'zod';

export const crearProductoSchema = z.object({
  sku: z.string({
    required_error: 'El campo SKU es obligatorio.'
  })
  .min(1, 'El SKU no puede estar vacío.')
  .max(50, 'El SKU no puede exceder 50 caracteres.')
  .transform((val) => val.trim().toUpperCase().replace(/\s+/g, '-')),

  nombre: z.string({
    required_error: 'El nombre del producto es obligatorio.'
  })
  .min(1, 'El nombre debe tener al menos 1 caracter.')
  .max(150, 'El nombre no puede exceder 150 caracteres.')
  .transform((val) => val.trim()),

  descripcion: z.string().max(500, 'La descripción no puede superar los 500 caracteres.').optional().default(''),

  categoria: z.string({
    required_error: 'La categoría es obligatoria.'
  })
  .min(1, 'La categoría no puede estar vacía.')
  .max(60, 'La categoría no puede exceder 60 caracteres.')
  .default('General')
  .transform((val) => val.trim() || 'General'),

  precio: z.coerce.number({
    required_error: 'El precio es obligatorio.',
    invalid_type_error: 'El precio debe ser un número válido.'
  })
  .min(0, 'El precio no puede ser negativo.')
  .max(10000000, 'El precio no puede exceder 10,000,000.'),

  stock: z.coerce.number({
    required_error: 'El stock es obligatorio.',
    invalid_type_error: 'El stock debe ser un número entero.'
  })
  .int('El stock debe ser un número entero.')
  .min(0, 'El stock no puede ser negativo.')
  .max(1000000, 'El stock no puede exceder 1,000,000 unidades.')
  .default(0)
});

export const actualizarProductoSchema = crearProductoSchema;

export const consultaProductosSchema = z.object({
  busqueda: z.string().optional(),
  categoria: z.string().optional()
});
