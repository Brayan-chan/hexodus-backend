# Hexodus Backend 🚀

Backend para la aplicación Hexodus, un sistema de gestión para gimnasios que permite administrar socios, membresías, ventas y más.

## 🎯 Objetivo del Proyecto

Desarrollar una API robusta para gestionar todas las operaciones de un gimnasio, incluyendo:
- ✅ Gestión de socios y sus membresías
- ✅ Control de ventas y productos
- ✅ Sistema de autenticación y autorización JWT
- ✅ Administración de inventario
- ✅ Reportes de ventas y gestión
- ✅ Movimientos de caja
- ✅ Gestión de roles y usuarios

## 🛠️ Tecnologías Utilizadas

- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **Supabase** - Base de datos PostgreSQL y autenticación
- **Zod** - Validación de esquemas
- **JWT** - Autenticación con tokens
- **CORS** - Configuración de CORS
- **dotenv** - Variables de entorno

## 📦 Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/Brayan-chan/hexodus-backend.git
```

2. Instalar dependencias:
```bash
cd hexodus-backend
npm install
```

3. Configurar variables de entorno:
- Crear archivo `.env` con las siguientes variables:
  ```env
  PORT=3000
  SUPABASE_URL=tu_url_de_supabase
  SUPABASE_ANON_KEY=tu_llave_anonima
  SUPABASE_SERVICE_ROLE_KEY=tu_llave_de_servicio
  ```

4. Iniciar el servidor:
```bash
# Desarrollo con auto-recarga
npm run dev

# Producción
npm start
```

## 🌐 Base URL

- **Local**: `http://localhost:3000`
- **Producción**: `https://hexodus-backend.vercel.app`

## 📋 API Documentation

### 🔐 Autenticación

Todas las rutas protegidas requieren el header:
```
Authorization: Bearer <tu_jwt_token>
Content-Type: application/json
```

#### Registrar Usuario (POST /api/auth/signup)
```bash
curl -X POST https://hexodus-backend.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hexodus.com",
    "password": "admin123456",
    "fullName": "Administrador Hexodus"
  }'
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "3866d804-fc9c-4724-8308-4ae71da108e8",
      "email": "admin@hexodus.com",
      "fullName": "Administrador Hexodus"
    },
    "session": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "yuoyo6ezcx7k"
    }
  },
  "message": "Usuario registrado. Verifica tu email para confirmar."
}
```

#### Iniciar Sesión (POST /api/auth/signin)
```bash
curl -X POST https://hexodus-backend.vercel.app/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hexodus.com",
    "password": "admin123456"
  }'
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "3866d804-fc9c-4724-8308-4ae71da108e8",
      "email": "admin@hexodus.com",
      "fullName": "Administrador Hexodus"
    },
    "session": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "yuoyo6ezcx7k",
      "expiresIn": 3600
    }
  }
}
```

#### Cerrar Sesión (POST /api/auth/logout)
```bash
curl -X POST https://hexodus-backend.vercel.app/api/auth/logout \
  -H "Authorization: Bearer <tu_token>"
```

#### Obtener Usuario Actual (GET /api/auth/user)
```bash
curl -X GET https://hexodus-backend.vercel.app/api/auth/user \
  -H "Authorization: Bearer <tu_token>"
```

### 👥 Gestión de Socios

#### Crear Socio (POST /api/socios)
```bash
curl -X POST https://hexodus-backend.vercel.app/api/socios \
  -H "Authorization: Bearer <tu_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Carlos",
    "apellido_paterno": "González",
    "apellido_materno": "López",
    "telefono": "5551234567",
    "email": "juan.gonzalez@email.com",
    "observaciones": "Cliente frecuente, interesado en entrenamientos de fuerza"
  }'
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "socio": {
      "id": "c9a12c86-3579-4f51-a396-9b1f2611da90",
      "codigo": "SOC-1763431632822",
      "nombre": "Juan Carlos",
      "apellido_paterno": "González",
      "apellido_materno": "López",
      "email": "juan.gonzalez@email.com",
      "telefono": "5551234567",
      "observaciones": "Cliente frecuente, interesado en entrenamientos de fuerza",
      "estado": "activo",
      "fecha_creacion": "2025-11-18T02:07:13.037975+00:00",
      "id_usuario": "1d895458-0239-4254-9494-f4d047bffad2"
    }
  }
}
```

#### Obtener Lista de Socios (GET /api/socios)
```bash
curl -X GET "https://hexodus-backend.vercel.app/api/socios?limit=50&offset=0&estado=activo" \
  -H "Authorization: Bearer <tu_token>"
```

**Parámetros de consulta:**
- `limit`: Número máximo de resultados (default: 50)
- `offset`: Número de registros a omitir (default: 0)
- `estado`: Filtrar por estado (`activo`, `inactivo`)
- `search`: Buscar por nombre, apellido o email

#### Obtener Socio por ID (GET /api/socios/:id)
```bash
curl -X GET https://hexodus-backend.vercel.app/api/socios/c9a12c86-3579-4f51-a396-9b1f2611da90 \
  -H "Authorization: Bearer <tu_token>"
```

#### Actualizar Socio (PUT /api/socios/:id)
```bash
curl -X PUT https://hexodus-backend.vercel.app/api/socios/c9a12c86-3579-4f51-a396-9b1f2611da90 \
  -H "Authorization: Bearer <tu_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "telefono": "5559876543",
    "observaciones": "Información actualizada"
  }'
```

#### Eliminar Socio (DELETE /api/socios/:id)
```bash
curl -X DELETE https://hexodus-backend.vercel.app/api/socios/c9a12c86-3579-4f51-a396-9b1f2611da90 \
  -H "Authorization: Bearer <tu_token>"
```

### 🎫 Gestión de Membresías

#### Obtener Tipos de Membresía (GET /api/memberships/types)
```bash
curl -X GET https://hexodus-backend.vercel.app/api/memberships/types \
  -H "Authorization: Bearer <tu_token>"
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "tiposMembresia": [
      {
        "id": "d6ec5057-a9f5-4c82-9391-045403444df7",
        "nombre": "Membresía Mensual",
        "tipo": "mensual",
        "duracion_meses": 1,
        "duracion_semanas": 0,
        "duracion_dias": 0,
        "precio": 80,
        "descripcion": "Acceso mensual completo",
        "estado": "activo"
      }
    ]
  }
}
```

#### Asignar Membresía a Socio (POST /api/memberships)
```bash
curl -X POST https://hexodus-backend.vercel.app/api/memberships \
  -H "Authorization: Bearer <tu_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "id_socio": "c9a12c86-3579-4f51-a396-9b1f2611da90",
    "id_tipo_membresia": "d6ec5057-a9f5-4c82-9391-045403444df7",
    "fecha_inicio": "2025-11-18T00:00:00Z",
    "fecha_vencimiento": "2025-12-18T23:59:59Z",
    "precio_pagado": 80.00,
    "estado_pago": "pagada"
  }'
```

#### Obtener Membresías (GET /api/memberships)
```bash
curl -X GET "https://hexodus-backend.vercel.app/api/memberships?id_socio=c9a12c86-3579-4f51-a396-9b1f2611da90" \
  -H "Authorization: Bearer <tu_token>"
```

### 🛒 Gestión de Productos

#### Crear Producto (POST /api/products)
```bash
curl -X POST https://hexodus-backend.vercel.app/api/products \
  -H "Authorization: Bearer <tu_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "PROT001",
    "nombre": "Proteína Whey",
    "descripcion": "Suplemento proteico de suero de leche",
    "costo": 18.50,
    "precio": 25.99,
    "stock": 100,
    "estado": "activo"
  }'
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "producto": {
      "id": "65b7bae0-90be-487f-8643-223ad93ff966",
      "codigo": "PROT001",
      "nombre": "Proteína Whey",
      "descripcion": "Suplemento proteico de suero de leche",
      "costo": 18.5,
      "precio": 25.99,
      "stock": 100,
      "stock_minimo": 5,
      "estado": "activo",
      "fecha_creacion": "2025-11-18T02:10:26.931055+00:00"
    }
  }
}
```

#### Obtener Lista de Productos (GET /api/products)
```bash
curl -X GET "https://hexodus-backend.vercel.app/api/products?limit=50&estado=activo" \
  -H "Authorization: Bearer <tu_token>"
```

#### Obtener Producto por ID (GET /api/products/:id)
```bash
curl -X GET https://hexodus-backend.vercel.app/api/products/65b7bae0-90be-487f-8643-223ad93ff966 \
  -H "Authorization: Bearer <tu_token>"
```

### 💰 Gestión de Ventas

#### Realizar Venta (POST /api/sales)
```bash
curl -X POST https://hexodus-backend.vercel.app/api/sales \
  -H "Authorization: Bearer <tu_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "id_producto": "65b7bae0-90be-487f-8643-223ad93ff966",
        "cantidad": 2,
        "precio_unitario": 25.99
      },
      {
        "id_producto": "8d70cdf5-5a9e-47f1-8277-3577675226f6",
        "cantidad": 3,
        "precio_unitario": 2.50
      }
    ],
    "metodo_pago": "efectivo",
    "monto_total": 59.48,
    "notas": "Primera venta de prueba",
    "id_socio": "c9a12c86-3579-4f51-a396-9b1f2611da90"
  }'
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "venta": {
      "id": "fd0b90a9-8c97-44ad-8622-29c352634b59",
      "numero_venta": "VTA-1763431964532",
      "id_socio": "c9a12c86-3579-4f51-a396-9b1f2611da90",
      "monto_total": 59.48,
      "metodo_pago": "efectivo",
      "notas": "Primera venta de prueba",
      "estado": "activo",
      "fecha_creacion": "2025-11-18T02:12:44.719002+00:00",
      "items": [...]
    }
  }
}
```

#### Obtener Lista de Ventas (GET /api/sales)
```bash
curl -X GET "https://hexodus-backend.vercel.app/api/sales?limit=50" \
  -H "Authorization: Bearer <tu_token>"
```

### 📊 Reportes

#### Reporte de Ventas (GET /api/reports/sales)
```bash
curl -X GET "https://hexodus-backend.vercel.app/api/reports/sales?fecha_inicio=2025-11-01&fecha_fin=2025-11-30" \
  -H "Authorization: Bearer <tu_token>"
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "report": {
      "titulo": "Reporte de Ventas",
      "fecha_generacion": "2025-11-18T02:15:51.107Z",
      "total_ventas": 1,
      "total_ingreso": 59.48,
      "total_productos": 5,
      "datos": [...]
    }
  }
}
```

#### Reporte de Inventario (GET /api/reports/inventory)
```bash
curl -X GET https://hexodus-backend.vercel.app/api/reports/inventory \
  -H "Authorization: Bearer <tu_token>"
```

#### Reporte de Membresías (GET /api/reports/memberships)
```bash
curl -X GET https://hexodus-backend.vercel.app/api/reports/memberships \
  -H "Authorization: Bearer <tu_token>"
```

### 🏪 Gestión de Inventario

#### Crear Producto de Inventario (POST /api/inventory)
```bash
curl -X POST https://hexodus-backend.vercel.app/api/inventory \
  -H "Authorization: Bearer <tu_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Banda Elástica",
    "stock": 25,
    "precio": 15.99,
    "tipo": "Equipo",
    "proveedor": "FitnessPro",
    "duracion": null
  }'
```

#### Obtener Inventario (GET /api/inventory)
```bash
curl -X GET "https://hexodus-backend.vercel.app/api/inventory?tipo=Equipo&status=activo" \
  -H "Authorization: Bearer <tu_token>"
```

### 💼 Gestión de Roles

#### Crear Rol (POST /api/roles)
```bash
curl -X POST https://hexodus-backend.vercel.app/api/roles \
  -H "Authorization: Bearer <tu_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Recepcionista",
    "rol": "recepcion",
    "descripcion": "Personal de recepción y atención al cliente"
  }'
```

#### Obtener Roles (GET /api/roles)
```bash
curl -X GET https://hexodus-backend.vercel.app/api/roles \
  -H "Authorization: Bearer <tu_token>"
```

### 💸 Gestión de Movimientos

#### Crear Movimiento (POST /api/movements)
```bash
curl -X POST https://hexodus-backend.vercel.app/api/movements \
  -H "Authorization: Bearer <tu_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "ingreso",
    "concepto_id": "uuid-del-concepto",
    "monto": 500.00,
    "tipo_pago": "efectivo",
    "observaciones": "Pago de membresía mensual"
  }'
```

#### Obtener Movimientos (GET /api/movements)
```bash
curl -X GET "https://hexodus-backend.vercel.app/api/movements?tipo=ingreso&fecha_inicio=2025-11-01" \
  -H "Authorization: Bearer <tu_token>"
```

#### Obtener Conceptos de Movimientos (GET /api/movements/concepts)
```bash
curl -X GET https://hexodus-backend.vercel.app/api/movements/concepts \
  -H "Authorization: Bearer <tu_token>"
```

## 🛡️ Códigos de Respuesta

| Código | Descripción |
|--------|-------------|
| 200 | ✅ Operación exitosa |
| 201 | ✅ Recurso creado exitosamente |
| 400 | ❌ Error en la solicitud (datos inválidos) |
| 401 | 🔒 No autorizado (token inválido/faltante) |
| 403 | 🚫 Prohibido (sin permisos) |
| 404 | 🔍 Recurso no encontrado |
| 500 | 💥 Error interno del servidor |

## 📝 Formato de Respuesta

Todas las respuestas siguen el formato estándar:

### Respuesta Exitosa
```json
{
  "success": true,
  "data": {
    // Datos de la respuesta
  },
  "message": "Mensaje opcional"
}
```

### Respuesta de Error
```json
{
  "success": false,
  "error": "Descripción del error",
  "code": "ERROR_CODE"
}
```

## 🔐 Autenticación

1. **Registrarse o iniciar sesión** para obtener un JWT token
2. **Incluir el token** en todas las rutas protegidas:
   ```
   Authorization: Bearer <tu_jwt_token>
   ```
3. **El token expira** después de 1 hora
4. **Usar refresh token** para renovar sesión

## 📊 Esquemas de Datos

### Socio
```javascript
{
  id: "uuid",
  codigo: "SOC-timestamp",
  nombre: "string",
  apellido_paterno: "string", 
  apellido_materno: "string",
  email: "email",
  telefono: "string",
  fecha_nacimiento: "date|null",
  genero: "string|null",
  direccion: "string|null",
  contacto_emergencia: "string|null",
  observaciones: "string|null",
  estado: "activo|inactivo",
  foto_url: "string|null",
  huella_url: "string|null",
  fecha_creacion: "timestamp",
  fecha_actualizacion: "timestamp"
}
```

### Producto
```javascript
{
  id: "uuid",
  codigo: "string",
  nombre: "string",
  descripcion: "string|null",
  costo: "decimal",
  precio: "decimal", 
  stock: "integer",
  stock_minimo: "integer",
  estado: "activo|inactivo",
  fecha_creacion: "timestamp",
  fecha_actualizacion: "timestamp"
}
```

### Venta
```javascript
{
  id: "uuid",
  numero_venta: "VTA-timestamp",
  id_socio: "uuid|null",
  monto_total: "decimal",
  metodo_pago: "efectivo|tarjeta|transferencia",
  notas: "string|null",
  estado: "activo|inactivo",
  fecha_creacion: "timestamp",
  detalles_venta: [
    {
      id_producto: "uuid",
      cantidad: "integer",
      precio_unitario: "decimal",
      subtotal: "decimal"
    }
  ]
}
```

### Membresía
```javascript
{
  id: "uuid",
  id_socio: "uuid",
  id_tipo_membresia: "uuid",
  fecha_inicio: "timestamp",
  fecha_vencimiento: "timestamp", 
  precio_pagado: "decimal",
  estado_pago: "sin_pagar|pagada|parcial",
  estado: "activo|inactivo",
  fecha_creacion: "timestamp"
}
```

## ⚡ Endpoints Rápidos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/health` | ✅ Estado del servidor |
| POST | `/api/auth/signup` | 👤 Registro |
| POST | `/api/auth/signin` | 🔐 Login |
| GET | `/api/socios` | 👥 Lista socios |
| POST | `/api/socios` | ➕ Crear socio |
| GET | `/api/memberships/types` | 🎫 Tipos membresía |
| POST | `/api/memberships` | 🎫 Asignar membresía |
| GET | `/api/products` | 🛒 Lista productos |
| POST | `/api/products` | ➕ Crear producto |
| POST | `/api/sales` | 💰 Realizar venta |
| GET | `/api/reports/sales` | 📊 Reporte ventas |

## 🚀 Estado del Proyecto

### ✅ Funcionalidades Completadas
- [x] **Autenticación JWT** completa
- [x] **Gestión de Socios** (CRUD completo)
- [x] **Sistema de Membresías** (tipos y asignación)
- [x] **Gestión de Productos** (inventario)
- [x] **Procesamiento de Ventas** (con detalles y stock)
- [x] **Reportes** (ventas, inventario, membresías)
- [x] **Movimientos de Caja** 
- [x] **Roles y Permisos**
- [x] **Validación de Datos** (Zod)
- [x] **Middleware de Autenticación**
- [x] **Row Level Security (RLS)**
- [x] **Manejo de Errores**

### 🔄 En Desarrollo
- [ ] Sistema de notificaciones
- [ ] Dashboard analytics
- [ ] Backup automatizado
- [ ] Rate limiting
- [ ] Logs de auditoría

## 🏗️ Estructura del Proyecto

```
hexodus-backend/
├── config/                    # Configuraciones
│   └── supabase-config.js    # Cliente Supabase
├── controllers/              # Lógica de negocio
│   ├── authController.js     # Autenticación
│   ├── sociosController.js   # Gestión socios
│   ├── membershipsController.js
│   ├── productsController.js
│   ├── salesController.js
│   ├── reportsController.js
│   └── ...
├── middleware/               # Middleware
│   ├── auth.js              # Verificación JWT
│   └── validation.js        # Validaciones
├── routes/                   # Definición rutas
│   ├── authRoutes.js
│   ├── sociosRoutes.js
│   └── ...
├── estructura-datos-tablas-base-de-datos/ # SQL schemas
│   ├── 01-tipos.sql         # Tipos enum
│   ├── 02-tablas.sql        # Estructura tablas
│   ├── 03-indices.sql       # Índices
│   ├── 04-triggers.sql      # Triggers
│   ├── 05-rls.sql          # Políticas RLS
│   └── 06-datos-iniciales.sql
├── index.js                 # Servidor principal
├── package.json            # Dependencias
├── vercel.json             # Configuración Vercel
└── .env                    # Variables entorno
```

## Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## Licencia

ISC