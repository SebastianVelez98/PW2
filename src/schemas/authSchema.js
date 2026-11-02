import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string({
    required_error: 'El nombre de usuario es obligatorio.'
  }).min(1, 'El nombre de usuario no puede estar vacío.'),

  password: z.string({
    required_error: 'La contraseña es obligatoria.'
  }).min(1, 'La contraseña no puede estar vacía.')
});

