# API REST de Gestión de Inventario

API REST profesional y robusta para la gestión y monitoreo de inventario en tiempo real, construida con **Node.js, Express, PostgreSQL (`pg`), Zod, Express-Session y Socket.io**. El proyecto implementa rigurosamente **Clean Architecture en Capas** y los principios de la **Programación Funcional**.

---

## 1. Características Principales

- **Arquitectura en Capas:** Aislamiento estricto de responsabilidades (`config`, `utils/pure`, `repositories`, `services`, `controllers`, `middlewares`, `routes`, `schemas`).
- **Programación Funcional Pura:** Transformaciones 100% deterministas, sin efectos secundarios, sin I/O, sin llamadas al reloj del sistema ni mutaciones de estado (`Object.freeze`, spread operator, map/filter/reduce).
- **Persistencia Segura en PostgreSQL:** Gestión mediante Connection Pool (`pg.Pool`), con consultas parametrizadas seguras (`$1, $2, ...`) resistentes a inyección SQL (SQL Injection). Compatible con PostgreSQL local y en la nube (Supabase, Neon, Render).
- **Validación Estricta con Zod:** Esquemas fuertemente tipados con sanitización previa y reporte granular de fallos de validación.
- **Seguridad y Sesiones:** Rutas de mutación (`POST`, `PUT`, `DELETE`) protegidas por `express-session` con cookies `httpOnly`.
- **Eventos en Tiempo Real:** Servidor HTTP integrado con `socket.io` y vista interactiva web (`public/index.html`) para streaming de eventos (`producto:creado`, `producto:actualizado`, `producto:eliminado`, `alerta:stock_bajo`).
- **Exportación de Archivos:** Endpoint `GET /api/productos/exportar/csv` para descarga dinámica en formato RFC 4180.
- **Calidad de Código y Pruebas:** 25 pruebas automatizadas (unitarias e integrales) mediante el test runner nativo de Node.js (`node:test`) y colección `requests.http`.

---

## 2. Estructura del Proyecto

```text
├── data/                         # Base de datos SQLite local (inventario.db)
├── public/
│   └── index.html                # Dashboard en tiempo real con Socket.io & Tailwind
├── src/
│   ├── config/
│   │   └── database.js           # Inicialización y pragmas de SQLite
│   ├── controllers/
│   │   ├── authController.js     # Manejo de peticiones de login/logout/sesión
│   │   └── productoController.js # Manejo de req/res y emisión de eventos Socket.io
│   ├── middlewares/
│   │   ├── authMiddleware.js     # Verificación de sesión activa (401)
│   │   ├── errorHandlerMiddleware.js # Manejo global de excepciones uniforme
│   │   └── validateMiddleware.js # Validador genérico de esquemas Zod (400)
│   ├── repositories/
│   │   ├── productoRepository.js # Operaciones de E/S exclusivas con SQLite
│   │   └── usuarioRepository.js  # Acceso a usuarios para autenticación
│   ├── routes/
│   │   ├── authRoutes.js         # Endpoints de /api/auth
│   │   └── productoRoutes.js     # Endpoints de /api/productos
│   ├── schemas/
│   │   ├── authSchema.js         # Esquemas Zod para credenciales
│   │   └── productoSchema.js     # Esquemas Zod para productos
│   ├── services/
│   │   ├── authService.js        # Lógica de autenticación
│   │   └── productoService.js    # Orquestación de negocio e inmutabilidad
│   ├── utils/
│   │   ├── errors.js             # Jerarquía de errores de dominio (400, 401, 404, 409)
│   │   └── pure/                 # TRANSFORMACIONES PURAS (100% Deterministas)
│   │       ├── businessRules.js        # Enriquecimiento y clasificación de estado
│   │       ├── formatters.js           # Formateo uniforme y generación de CSV
│   │       ├── inventoryCalculations.js # Sumatorias de stock, métricas e impuestos
│   │       └── normalizers.js          # Sanitización de strings y payloads
│   ├── app.js                    # Ensamblaje de middlewares y rutas Express
│   └── server.js                 # Servidor HTTP + Socket.io + Graceful Shutdown
├── tests/
│   ├── api.test.js               # Pruebas integrales de endpoints y sesiones
│   └── pure.test.js              # Pruebas unitarias de transformaciones puras
├── INFORME_TECNICO.md            # Informe técnico formal de arquitectura
├── package.json
└── requests.http                 # Colección ejecutable para REST Client / Thunder Client
```

---

## 3. Instalación y Puesta en Marcha

### Requisitos Previos
- **Node.js**: v18 o superior (probado en Node.js v23).
- **npm**: v9 o superior.

### Pasos de Ejecución
1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar el servidor en modo desarrollo:**
   ```bash
   npm run dev
   ```
   *O en modo producción:*
   ```bash
   npm start
   ```

3. **Abrir el Dashboard en Tiempo Real:**
   Navega en tu navegador a:
   [http://localhost:3000](http://localhost:3000)

4. **Ejecutar la Suite de Pruebas Automatizadas:**
   ```bash
   npm test
   ```

---

## 4. Credenciales de Acceso Predeterminadas

La base de datos se inicializa automáticamente con un usuario administrador predeterminado:
- **Usuario:** `admin`
- **Contraseña:** `admin123`

---

## 5. Especificación de Endpoints y Ejemplos de Petición/Respuesta

### Formato Uniforme de Error
Cualquier error devuelto por la API cumple estrictamente con el siguiente contrato:
```json
{
  "ok": false,
  "error": {
    "codigo": "CODIGO_INTERNO",
    "mensaje": "Descripción clara del motivo del fallo",
    "detalles": []
  },
  "timestamp": "2026-11-01T17:00:00.000Z"
}
```

---

### 5.1 Autenticación (`/api/auth`)

#### `POST /api/auth/login`
Inicia sesión y genera la cookie de sesión (`connect.sid`).

- **Request:**
  ```http
  POST /api/auth/login HTTP/1.1
  Content-Type: application/json

  {
    "username": "admin",
    "password": "admin123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "ok": true,
    "data": {
      "id": 1,
      "username": "admin",
      "nombre": "Administrador General",
      "rol": "administrador"
    },
    "meta": {
      "mensaje": "Autenticación exitosa. Sesión iniciada."
    }
  }
  ```

#### `GET /api/auth/me`
Consulta el usuario actualmente autenticado en la sesión.

- **Response (200 OK):**
  ```json
  {
    "ok": true,
    "data": {
      "id": 1,
      "username": "admin",
      "nombre": "Administrador General",
      "rol": "administrador"
    },
    "meta": {
      "activo": true
    }
  }
  ```

#### `POST /api/auth/logout`
Destruye la sesión activa y elimina la cookie del cliente.

- **Response (200 OK):**
  ```json
  {
    "ok": true,
    "data": {
      "autenticado": false
    },
    "meta": {
      "mensaje": "Sesión cerrada correctamente."
    }
  }
  ```

---

### 5.2 Productos (`/api/productos`)

#### `GET /api/productos`
Lista todos los productos del inventario, con soporte opcional para filtros (`?busqueda=...&categoria=...`). Devuelve además las métricas globales calculadas puramente.

- **Request:**
  ```http
  GET /api/productos HTTP/1.1
  ```
- **Response (200 OK):**
  ```json
  {
    "ok": true,
    "data": [
      {
        "id": 1,
        "sku": "TEC-MEC-RGB",
        "nombre": "Teclado Mecánico Switch Red",
        "descripcion": "Teclado gamer 75%",
        "categoria": "Periféricos",
        "precio": 89.99,
        "stock": 18,
        "creado_en": "2026-11-01T17:00:00.000Z",
        "actualizado_en": "2026-11-01T17:00:00.000Z",
        "calculos": {
          "impuesto": 13.5,
          "precioTotal": 103.49,
          "estadoStock": "OPTIMO",
          "requiereAlertaStock": false
        }
      }
    ],
    "meta": {
      "metricas": {
        "totalProductos": 1,
        "totalUnidades": 18,
        "valorTotalInventario": 1619.82,
        "productosConStockBajo": 0
      }
    }
  }
  ```

---

#### `GET /api/productos/:id`
Obtiene los detalles de un producto por su clave primaria.

- **Response (200 OK):**
  ```json
  {
    "ok": true,
    "data": {
      "id": 1,
      "sku": "TEC-MEC-RGB",
      "nombre": "Teclado Mecánico Switch Red",
      "descripcion": "Teclado gamer 75%",
      "categoria": "Periféricos",
      "precio": 89.99,
      "stock": 18,
      "creado_en": "2026-11-01T17:00:00.000Z",
      "actualizado_en": "2026-11-01T17:00:00.000Z",
      "calculos": {
        "impuesto": 13.5,
        "precioTotal": 103.49,
        "estadoStock": "OPTIMO",
        "requiereAlertaStock": false
      }
    }
  }
  ```

---

#### `POST /api/productos` (Protegido por Sesión)
Crea un nuevo producto en el catálogo. Emite el evento `producto:creado` por Socket.io. Si el stock es $\le 5$, emite adicionalmente `alerta:stock_bajo`.

- **Request:**
  ```http
  POST /api/productos HTTP/1.1
  Content-Type: application/json
  Cookie: connect.sid=...

  {
    "sku": "AUR-INAL-BT",
    "nombre": "Auriculares Inalámbricos Pro",
    "descripcion": "Cancelación de ruido activa",
    "categoria": "Audio",
    "precio": 120.50,
    "stock": 4
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "ok": true,
    "data": {
      "id": 2,
      "sku": "AUR-INAL-BT",
      "nombre": "Auriculares Inalámbricos Pro",
      "descripcion": "Cancelación de ruido activa",
      "categoria": "Audio",
      "precio": 120.5,
      "stock": 4,
      "creado_en": "2026-11-01T17:05:00.000Z",
      "actualizado_en": "2026-11-01T17:05:00.000Z",
      "calculos": {
        "impuesto": 18.08,
        "precioTotal": 138.58,
        "estadoStock": "BAJO",
        "requiereAlertaStock": true
      }
    }
  }
  ```

---

#### `PUT /api/productos/:id` (Protegido por Sesión)
Actualiza un producto existente. Emite `producto:actualizado` por Socket.io.

- **Request:**
  ```http
  PUT /api/productos/2 HTTP/1.1
  Content-Type: application/json
  Cookie: connect.sid=...

  {
    "sku": "AUR-INAL-BT",
    "nombre": "Auriculares Inalámbricos Pro Max",
    "descripcion": "Edición especial negra",
    "categoria": "Audio",
    "precio": 135.00,
    "stock": 15
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "ok": true,
    "data": {
      "id": 2,
      "sku": "AUR-INAL-BT",
      "nombre": "Auriculares Inalámbricos Pro Max",
      "descripcion": "Edición especial negra",
      "categoria": "Audio",
      "precio": 135,
      "stock": 15,
      "creado_en": "2026-11-01T17:05:00.000Z",
      "actualizado_en": "2026-11-01T17:10:00.000Z",
      "calculos": {
        "impuesto": 20.25,
        "precioTotal": 155.25,
        "estadoStock": "OPTIMO",
        "requiereAlertaStock": false
      }
    }
  }
  ```

---

#### `DELETE /api/productos/:id` (Protegido por Sesión)
Elimina un producto por su identificador. Emite `producto:eliminado` por Socket.io.

- **Request:**
  ```http
  DELETE /api/productos/2 HTTP/1.1
  Cookie: connect.sid=...
  ```
- **Response (200 OK):**
  ```json
  {
    "ok": true,
    "data": {
      "id": 2,
      "sku": "AUR-INAL-BT",
      "nombre": "Auriculares Inalámbricos Pro Max",
      "categoria": "Audio",
      "precio": 135,
      "stock": 15
    },
    "meta": {
      "mensaje": "Producto eliminado satisfactoriamente."
    }
  }
  ```

---

#### `GET /api/productos/exportar/csv`
Descarga todo el inventario consolidado como archivo CSV estructurado según RFC 4180.

- **Response (200 OK):**
  - **Headers:** `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="inventario_2026-11-01.csv"`
  - **Body (ejemplo):**
    ```csv
    ID,SKU,Nombre,Descripcion,Categoria,Precio,Stock,CreadoEn,ActualizadoEn
    "1","TEC-MEC-RGB","Teclado Mecánico Switch Red","Teclado gamer 75%","Periféricos","89.99","18","2026-11-01T17:00:00.000Z","2026-11-01T17:00:00.000Z"
    ```

---

## 6. Ejemplos de Manejo Estricto de Errores

### 6.1 Error 400 Bad Request (Fallo de Validación Zod)
Se produce cuando los tipos de datos o reglas de esquema no se cumplen.
- **Request:**
  ```http
  POST /api/productos HTTP/1.1
  Content-Type: application/json
  Cookie: connect.sid=...

  {
    "sku": "A",
    "nombre": "",
    "categoria": "Hardware",
    "precio": -10,
    "stock": 2.5
  }
  ```
- **Response (400 Bad Request):**
  ```json
  {
    "ok": false,
    "error": {
      "codigo": "VALIDACION_FALLIDA",
      "mensaje": "Uno o más campos enviados son inválidos o faltantes.",
      "detalles": [
        {
          "campo": "sku",
          "mensaje": "El SKU debe contener al menos 3 caracteres.",
          "codigo": "too_small"
        },
        {
          "campo": "nombre",
          "mensaje": "El nombre debe tener al menos 2 caracteres.",
          "codigo": "too_small"
        },
        {
          "campo": "precio",
          "mensaje": "El precio debe ser un valor mayor a cero.",
          "codigo": "too_small"
        },
        {
          "campo": "stock",
          "mensaje": "El stock debe ser un número entero.",
          "codigo": "invalid_type"
        }
      ]
    },
    "timestamp": "2026-11-01T17:15:22.100Z"
  }
  ```

---

### 6.2 Error 401 Unauthorized (Intento sin Sesión Activa)
Se produce cuando se intenta invocar `POST`, `PUT` o `DELETE` sin la cookie de sesión correspondiente.
- **Request:**
  ```http
  POST /api/productos HTTP/1.1
  Content-Type: application/json

  {
    "sku": "PROD-SIN-SESION",
    "nombre": "Acción No Permitida",
    "categoria": "Test",
    "precio": 50,
    "stock": 10
  }
  ```
- **Response (401 Unauthorized):**
  ```json
  {
    "ok": false,
    "error": {
      "codigo": "NO_AUTORIZADO",
      "mensaje": "Acceso denegado: Se requiere una sesión activa para ejecutar esta acción.",
      "detalles": []
    },
    "timestamp": "2026-11-01T17:16:05.420Z"
  }
  ```

---

### 6.3 Error 404 Not Found (Recurso No Existente)
Se produce cuando se solicita un identificador que no reside en la base de datos o una ruta inexistente.
- **Request:**
  ```http
  GET /api/productos/99999 HTTP/1.1
  ```
- **Response (404 Not Found):**
  ```json
  {
    "ok": false,
    "error": {
      "codigo": "NOT_FOUND",
      "mensaje": "Producto con ID 99999 no encontrado en el sistema.",
      "detalles": []
    },
    "timestamp": "2026-11-01T17:17:10.890Z"
  }
  ```

---

### 6.4 Error 409 Conflict (Colisión de SKU Duplicado)
Se produce cuando se intenta registrar o actualizar un producto con un SKU que ya está registrado.
- **Request:**
  ```http
  POST /api/productos HTTP/1.1
  Content-Type: application/json
  Cookie: connect.sid=...

  {
    "sku": "TEC-MEC-RGB",
    "nombre": "Teclado Replicado",
    "categoria": "Periféricos",
    "precio": 99.00,
    "stock": 5
  }
  ```
- **Response (409 Conflict):**
  ```json
  {
    "ok": false,
    "error": {
      "codigo": "SKU_DUPLICADO",
      "mensaje": "Conflicto de integridad: El producto con código SKU 'TEC-MEC-RGB' ya existe.",
      "detalles": [
        {
          "campo": "sku",
          "valor": "TEC-MEC-RGB"
        }
      ]
    },
    "timestamp": "2026-11-01T17:18:00.312Z"
  }
  ```

---

## 7. Eventos de Socket.io en Tiempo Real

El servidor HTTP integra Socket.io permitiendo a los clientes Web o móviles sincronizarse en vivo:

| Evento | Causa | Carga Útil (Payload) |
|---|---|---|
| `producto:creado` | Se registra un nuevo producto en la base de datos | Objeto del producto enriquecido con cálculos |
| `producto:actualizado` | Se modifican datos o stock de un producto | Objeto actualizado y nuevos cálculos |
| `producto:eliminado` | Se borra un producto | `{ id, sku, nombre }` |
| `alerta:stock_bajo` | El stock cae por debajo o igual a 5 unidades | `{ tipo: "STOCK_CRITICO", producto, stockActual, mensaje }` |
| `sistema:bienvenida` | Nuevo cliente WebSocket conectado | Confirmación con timestamp del servidor |

---

## 8. Pruebas y Validación de Calidad

El proyecto incluye 25 pruebas automatizadas organizadas en:
1. **Pruebas de Transformaciones Puras (`tests/pure.test.js`):** Validan inmutabilidad estricta con `Object.freeze`, sumatorias matemáticas, redondeos, sanitización de SKU y generación de CSV según RFC 4180.
2. **Pruebas de Integración de Endpoints (`tests/api.test.js`):** Validan el ciclo de vida completo de la API REST, autenticación con cookies, control de acceso 401, validaciones 400, conflictos 409 y respuestas 404.

Ejecutar:
```bash
npm test
```
Resultados esperados:
```text
ℹ tests 25
ℹ pass 25
ℹ fail 0
```

