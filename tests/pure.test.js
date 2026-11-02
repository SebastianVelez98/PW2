/**
 * Pruebas Unitarias para la Capa de Transformaciones Puras (utils/pure/)
 * Demuestra:
 * - Determinismo
 * - Cero efectos secundarios
 * - Inmutabilidad (Object.freeze)
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calcularValorTotalStock,
  calcularImpuesto,
  calcularPrecioConImpuesto,
  evaluarStockBajo,
  calcularMetricasInventario
} from '../src/utils/pure/inventoryCalculations.js';

import {
  normalizarSku,
  normalizarTexto,
  sanitizarPayloadProducto
} from '../src/utils/pure/normalizers.js';

import {
  formatearRespuestaExito,
  formatearRespuestaError,
  escaparCampoCsv,
  convertirAFormatoCsv
} from '../src/utils/pure/formatters.js';

import {
  clasificarEstadoStock,
  enriquecerProducto,
  enriquecerListaProductos
} from '../src/utils/pure/businessRules.js';

test('Capa Pura: inventoryCalculations', async (t) => {
  await t.test('calcularValorTotalStock calcula la sumatoria correcta', () => {
    const productos = [
      { precio: 10.5, stock: 4 },
      { precio: 20, stock: 2 }
    ];
    // (10.5 * 4) + (20 * 2) = 42 + 40 = 82
    assert.equal(calcularValorTotalStock(productos), 82);
  });

  await t.test('calcularImpuesto calcula tasa fija redondeada a 2 decimales', () => {
    assert.equal(calcularImpuesto(100, 0.15), 15);
    assert.equal(calcularImpuesto(33.33, 0.15), 5);
  });

  await t.test('evaluarStockBajo retorna true solo si stock <= umbral', () => {
    assert.equal(evaluarStockBajo(5, 5), true);
    assert.equal(evaluarStockBajo(2, 5), true);
    assert.equal(evaluarStockBajo(6, 5), false);
  });

  await t.test('calcularMetricasInventario produce un objeto inmutable', () => {
    const prods = [
      { id: 1, precio: 10, stock: 2 },
      { id: 2, precio: 50, stock: 10 }
    ];
    const metricas = calcularMetricasInventario(prods);

    assert.equal(metricas.totalProductos, 2);
    assert.equal(metricas.totalUnidades, 12);
    assert.equal(metricas.valorTotalInventario, 520);
    assert.equal(metricas.productosConStockBajo, 1);
    assert.throws(() => {
      // Intentar mutar debe fallar por Object.freeze
      metricas.totalProductos = 99;
    });
  });
});

test('Capa Pura: normalizers', async (t) => {
  await t.test('normalizarSku limpia espacios y convierte a mayúsculas con guiones', () => {
    assert.equal(normalizarSku('  mon 24 ips  '), 'MON-24-IPS');
  });

  await t.test('sanitizarPayloadProducto devuelve un objeto inmutable y normalizado', () => {
    const raw = {
      sku: '  teclado rgb ',
      nombre: '  Teclado   Mecánico  ',
      descripcion: '  Switch Blue  ',
      categoria: '  Gaming ',
      precio: '129.999',
      stock: '15'
    };
    const clean = sanitizarPayloadProducto(raw);

    assert.equal(clean.sku, 'TECLADO-RGB');
    assert.equal(clean.nombre, 'Teclado Mecánico');
    assert.equal(clean.descripcion, 'Switch Blue');
    assert.equal(clean.categoria, 'Gaming');
    assert.equal(clean.precio, 130);
    assert.equal(clean.stock, 15);
    assert.throws(() => {
      clean.precio = 50;
    });
  });
});

test('Capa Pura: formatters y CSV', async (t) => {
  await t.test('formatearRespuestaError cumple la firma estricta', () => {
    const err = formatearRespuestaError('CODIGO_X', 'Mensaje X', ['Detalle 1'], '2026-11-01T00:00:00Z');
    assert.deepEqual(err, {
      ok: false,
      error: {
        codigo: 'CODIGO_X',
        mensaje: 'Mensaje X',
        detalles: ['Detalle 1']
      },
      timestamp: '2026-11-01T00:00:00Z'
    });
  });

  await t.test('convertirAFormatoCsv genera RFC 4180 válido con escape de comillas', () => {
    const lista = [
      {
        id: 1,
        sku: 'LAP-01',
        nombre: 'Laptop "Gamer", Pro',
        descripcion: 'Intel i7\n16GB RAM',
        categoria: 'Computación',
        precio: 1200,
        stock: 4,
        creado_en: '2026-01-01',
        actualizado_en: '2026-01-01'
      }
    ];

    const csv = convertirAFormatoCsv(lista);
    assert.ok(csv.startsWith('ID,SKU,Nombre,Descripcion,Categoria,Precio,Stock,CreadoEn,ActualizadoEn'));
    assert.ok(csv.includes('"Laptop ""Gamer"", Pro"'));
  });
});

