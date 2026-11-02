/**
 * Suite de Pruebas Automatizadas para la API REST contra PostgreSQL
 * Utiliza el ejecutor nativo de Node.js (node:test) y supertest
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { getPool, inicializarBaseDeDatos, closeDatabase } from '../src/config/database.js';

test('Suite Integral: API REST de Inventario (PostgreSQL Real)', async (t) => {
  const pool = getPool();
  await inicializarBaseDeDatos(pool);

  const app = createApp();

  let authCookie = null;
  let productoCreadoId = null;
  const skuPrueba = `TEST-${Date.now()}`;

  t.after(async () => {
    // Limpieza de datos de prueba
    if (productoCreadoId) {
      await pool.query('DELETE FROM productos WHERE id = $1', [productoCreadoId]);
    }
    await pool.query('DELETE FROM productos WHERE sku LIKE $1', ['TEST-%']);
    await closeDatabase();
  });

  await t.test('1. Seguridad: Rechazar POST sin sesión activa (401 Unauthorized)', async () => {
    const res = await request(app)
      .post('/api/productos')
      .send({
        sku: 'SIN-AUTH-01',
        nombre: 'Producto Sin Sesion',
        categoria: 'Pruebas',
        precio: 50,
        stock: 10
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.ok, false);
    assert.equal(res.body.error.codigo, 'NO_AUTORIZADO');
    assert.ok(res.body.timestamp);
  });

  await t.test('2. Autenticación: Login con credenciales válidas (200 OK)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.data.username, 'admin');
    assert.equal(res.body.data.rol, 'administrador');

    const cookies = res.headers['set-cookie'];
    assert.ok(cookies, 'Debe devolver cookie set-cookie');
    authCookie = cookies.map((c) => c.split(';')[0]).join('; ');
  });

  await t.test('3. Sesión: Verificar usuario activo en /api/auth/me (200 OK)', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', authCookie);

    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.data.username, 'admin');
  });

  await t.test('4. Validación: Rechazar producto con datos inválidos (400 Bad Request)', async () => {
    const res = await request(app)
      .post('/api/productos')
      .set('Cookie', authCookie)
      .send({
        sku: '',
        nombre: '',
        precio: -15,
        stock: -3
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.ok, false);
    assert.equal(res.body.error.codigo, 'VALIDACION_FALLIDA');
    assert.ok(Array.isArray(res.body.error.detalles));
  });

  await t.test('5. Creación: Registrar producto exitosamente en PostgreSQL (201 Created)', async () => {
    const res = await request(app)
      .post('/api/productos')
      .set('Cookie', authCookie)
      .send({
        sku: skuPrueba,
        nombre: 'Mouse Inalámbrico Pro',
        descripcion: 'Sensor óptico en PostgreSQL',
        categoria: 'Periféricos',
        precio: 29.99,
        stock: 3 // Menor a 5: stock bajo
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.data.sku, skuPrueba);
    assert.equal(res.body.data.calculos.estadoStock, 'BAJO');
    assert.equal(res.body.data.calculos.requiereAlertaStock, true);
    assert.ok(res.body.data.calculos.impuesto > 0);

    productoCreadoId = res.body.data.id;
  });

  await t.test('6. Integridad: Conflicto al intentar crear SKU duplicado (409 Conflict)', async () => {
    const res = await request(app)
      .post('/api/productos')
      .set('Cookie', authCookie)
      .send({
        sku: skuPrueba,
        nombre: 'Mouse Clon Duplicado',
        categoria: 'Periféricos',
        precio: 35.00,
        stock: 10
      });

    assert.equal(res.status, 409);
    assert.equal(res.body.ok, false);
    assert.equal(res.body.error.codigo, 'SKU_DUPLICADO');
  });

  await t.test('7. Lectura: Listar productos con métricas de inventario (200 OK)', async () => {
    const res = await request(app).get('/api/productos');

    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.meta?.metricas);
    assert.ok(res.body.meta.metricas.totalProductos >= 1);
  });

  await t.test('8. Lectura por ID: Obtener producto existente (200 OK)', async () => {
    const res = await request(app).get(`/api/productos/${productoCreadoId}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.data.id, productoCreadoId);
  });

  await t.test('9. Lectura por ID inexistente: Error 404 Not Found', async () => {
    const res = await request(app).get('/api/productos/999999');

    assert.equal(res.status, 404);
    assert.equal(res.body.ok, false);
    assert.equal(res.body.error.codigo, 'NOT_FOUND');
  });

  await t.test('10. Actualización: Modificar datos y stock de producto (200 OK)', async () => {
    const res = await request(app)
      .put(`/api/productos/${productoCreadoId}`)
      .set('Cookie', authCookie)
      .send({
        sku: skuPrueba,
        nombre: 'Mouse Inalámbrico Pro Max (Actualizado)',
        categoria: 'Periféricos',
        precio: 34.50,
        stock: 25
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.data.nombre, 'Mouse Inalámbrico Pro Max (Actualizado)');
    assert.equal(res.body.data.stock, 25);
    assert.equal(res.body.data.calculos.estadoStock, 'OPTIMO');
  });

  await t.test('11. Exportación: Descargar CSV de catálogo (200 OK)', async () => {
    const res = await request(app).get('/api/productos/exportar/csv');

    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /text\/csv/);
    assert.ok(res.text.includes('ID,SKU,Nombre,Descripcion,Categoria,Precio,Stock'));
  });

  await t.test('12. Eliminación: Borrar producto con sesión activa (200 OK)', async () => {
    const res = await request(app)
      .delete(`/api/productos/${productoCreadoId}`)
      .set('Cookie', authCookie);

    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.data.id, productoCreadoId);

    const checkRes = await request(app).get(`/api/productos/${productoCreadoId}`);
    assert.equal(checkRes.status, 404);
  });

  await t.test('13. Cierre de Sesión: Logout (200 OK)', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', authCookie);

    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);

    const intentoRes = await request(app).delete('/api/productos/1');
    assert.equal(intentoRes.status, 401);
  });
});
