# Hexodus Backend 🚀

Backend para la aplicación Hexodus, un sistema de gestión para gimnasios que permite administrar socios, membresías, ventas y más.

## 🎯 Objetivo del Proyecto

Desarrollar una API robusta para gestionar todas las operaciones de un gimnasio, incluyendo:
- ✅ Gestión de socios y sus membresías
- ✅ Control de ventas y productos
- ✅ Sistema de autenticación y autorización JWT con Firebase
- ✅ Administración de inventario
- ✅ Reportes de ventas y gestión
- ✅ Movimientos de caja
- ✅ Gestión de roles y usuarios

## 🛠️ Tecnologías Utilizadas

- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **Firebase** - Autenticación y base de datos Firestore
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
  PORT=3300
  JWT_SECRET=hexodus-secret-key-2024
  ```

4. Configurar Firebase:
- El proyecto está configurado para usar Firebase con las siguientes credenciales:
  ```javascript
  const firebaseConfig = {
    apiKey: "AIzaSyC4qznu3hKRByQRSIm4pkc__-J6e8JqTPk",
    authDomain: "hexodusgym.firebaseapp.com",
    projectId: "hexodusgym",
    storageBucket: "hexodusgym.firebasestorage.app",
    messagingSenderId: "575555434492",
    appId: "1:575555434492:web:af4584fcfc3c424d74e479"
  };
  ```

5. Iniciar el servidor:
```bash
# Desarrollo
node index.js

# Con nodemon (si está instalado)
npm run dev
```

## 🌐 Base URL

- **Local**: `http://localhost:3300`
- **Producción**: `https://hexodus-backend.vercel.app`

## 📋 API Documentation

### 🔐 Autenticación

Todas las rutas protegidas requieren el header:
```
Authorization: Bearer <tu_jwt_token>
Content-Type: application/json
```

#### Registrar Usuario (POST /auth/register)
```bash
curl -X POST http://localhost:3300/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hexodus.com",
    "password": "admin123456",
    "nombre": "Administrador Hexodus",
    "telefono": "1234567890",
    "rol": "admin"
  }'
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "eBrg8JLxzsUnIKTcS2iNWWv5tng2",
      "email": "admin@hexodus.com",
      "nombre": "Administrador Hexodus",
      "telefono": "1234567890",
      "rol": "admin",
      "status": "activo"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Usuario registrado exitosamente"
}
```

#### Iniciar Sesión (POST /auth/login)
```bash
curl -X POST http://localhost:3300/auth/login \
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
      "id": "eBrg8JLxzsUnIKTcS2iNWWv5tng2",
      "email": "admin@hexodus.com",
      "nombre": "Administrador Hexodus",
      "telefono": "1234567890",
      "rol": "admin",
      "status": "activo"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Inicio de sesión exitoso"
}
```

#### Obtener Usuario Actual (GET /auth/me)
```bash
curl -X GET http://localhost:3300/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "eBrg8JLxzsUnIKTcS2iNWWv5tng2",
      "email": "admin@hexodus.com",
      "nombre": "Administrador Hexodus",
      "telefono": "1234567890",
      "rol": "admin",
      "status": "activo"
    }
  },
  "message": "Usuario obtenido correctamente"
}
```

#### Cerrar Sesión (POST /auth/logout)
```bash
curl -X POST http://localhost:3300/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Sesión cerrada correctamente"
}
```

#### Obtener Todos los Usuarios (GET /auth/users) - Solo Admin
```bash
curl -X GET http://localhost:3300/auth/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "uid": "eBrg8JLxzsUnIKTcS2iNWWv5tng2",
        "email": "admin@hexodus.com",
        "nombre": "Administrador Hexodus",
        "telefono": "1234567890",
        "rol": "admin",
        "status": "activo"
      }
    ]
  }
}
```

### ⚠️ Gestión de Errores

La API maneja los siguientes códigos de error:

- **400** - Bad Request: Datos de entrada inválidos
- **401** - Unauthorized: Token JWT inválido o expirado
- **403** - Forbidden: No tiene permisos para esta acción
- **404** - Not Found: Recurso no encontrado
- **409** - Conflict: Conflicto de datos (ej: email duplicado)
- **500** - Internal Server Error: Error interno del servidor

**Ejemplo de respuesta de error:**
```json
{
  "success": false,
  "error": "Email ya registrado",
  "details": "El email admin@hexodus.com ya está en uso"
}
```

## 🚧 Módulos en Desarrollo

Los siguientes módulos están en proceso de migración a Firebase y estarán disponibles próximamente:

### 👥 Gestión de Socios
- Crear, consultar, actualizar y eliminar socios
- Sistema de búsqueda y filtros
- Gestión de estados (activo/inactivo)

### 🎫 Gestión de Membresías  
- Tipos de membresías configurables
- Asignación de membresías a socios
- Control de vencimientos y renovaciones

### 🛒 Gestión de Productos
- Catálogo de productos y suplementos
- Control de inventario y stock
- Gestión de precios y costos

### 💰 Gestión de Ventas
- Registro de ventas de productos y membresías
- Historial de transacciones
- Reportes de ventas

### 📊 Sistema de Reportes
- Reportes de ventas por período
- Estadísticas de socios activos
- Análisis de productos más vendidos

### 🎯 Control de Inventario
- Movimientos de entrada y salida
- Alertas de stock mínimo
- Historial de movimientos

### 🔑 Gestión de Roles
- Roles de usuario configurables
- Permisos granulares por módulo
- Gestión de acceso a funcionalidades

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
## 📊 Esquemas de Datos de Firebase

### Usuario (Colección: usuarios)
```javascript
{
  uid: "firebase_uid",
  email: "string",
  nombre: "string",
  telefono: "string",
  rol: "admin|recepcion|empleado",
  status: "activo|inactivo",
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

## 🚀 Despliegue

### Vercel (Recomendado)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel
```

### Variables de Entorno en Producción
- `PORT`: Puerto del servidor (default: 3300)
- `JWT_SECRET`: Clave secreta para JWT
- `NODE_ENV`: Entorno de ejecución

## 🧪 Testing

```bash
# Health check
curl http://localhost:3300/health

# Test de registro
curl -X POST http://localhost:3300/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","nombre":"Test User","telefono":"1234567890","rol":"admin"}'
```

## 📂 Estructura del Proyecto

```
hexodus-backend/
├── index.js              # Servidor principal
├── package.json           # Dependencias
├── vercel.json           # Configuración Vercel
├── config/
│   └── firebase-config.js # Configuración Firebase
├── controllers/
│   └── authController.js  # Lógica de autenticación
├── middleware/
│   ├── auth.js           # Middleware JWT
│   └── validation.js     # Validación Zod
└── routes/
    └── authRoutes.js     # Rutas de autenticación
```

## 👥 Contribuir

1. Fork el proyecto
2. Crear rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 📞 Contacto

- **Desarrollador**: Brayan Chan
- **Email**: brayanchan@example.com
- **Proyecto**: [https://github.com/Brayan-chan/hexodus-backend](https://github.com/Brayan-chan/hexodus-backend)

---

⭐️ **Hecho con ❤️ para Hexodus Gym**
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