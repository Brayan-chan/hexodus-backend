# Hexodus Backend API 🚀

Sistema de backend completo para gestión de gimnasios con Firebase, autenticación JWT y gestión de productos/usuarios.

## 🎯 Características Principales

### ✅ **Sistema de Usuarios Completo**
- Autenticación con Firebase Auth + JWT
- Gestión CRUD de usuarios con roles (admin/vendedor)
- Validación de teléfonos opcional con fallback inteligente
- Búsqueda, filtrado y paginación de usuarios
- Control de estados (activo/inactivo)

### ✅ **Sistema de Productos Completo**
- CRUD completo de productos con Firebase Firestore
- Búsqueda inteligente (nombre, código, descripción)
- Filtros avanzados (status, rangos de precio)
- Paginación robusta
- UUIDs únicos y timestamps automáticos

### ✅ **Seguridad y Validación**
- Autenticación JWT con Firebase
- Validación de esquemas con Zod
- Permisos basados en roles
- Protección CORS configurada

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Node.js** | 20+ | Runtime de JavaScript |
| **Express** | ^4.18.0 | Framework web |
| **Firebase** | ^10.0.0 | Auth + Firestore Database |
| **Zod** | ^3.22.0 | Validación de esquemas |
| **JWT** | ^9.0.0 | Tokens de autenticación |
| **CORS** | ^2.8.5 | Control de acceso cross-origin |

## 📦 Instalación y Configuración

### 1. **Clonar repositorio**
```bash
git clone https://github.com/Brayan-chan/hexodus-project.git
cd hexodus-project/hexodus-backend
```

### 2. **Instalar dependencias**
```bash
npm install
```

### 3. **Variables de entorno**
Crear archivo `.env`:
```env
PORT=3300
JWT_SECRET=hexodus-secret-key-2024
NODE_ENV=production
```

### 4. **Configuración Firebase**
El proyecto usa Firebase con la siguiente configuración:
```javascript
// config/firebase-config.js
const firebaseConfig = {
  apiKey: "AIzaSyC4qznu3hKRByQRSIm4pkc__-J6e8JqTPk",
  authDomain: "hexodusgym.firebaseapp.com", 
  projectId: "hexodusgym",
  storageBucket: "hexodusgym.firebasestorage.app",
  messagingSenderId: "575555434492",
  appId: "1:575555434492:web:af4584fcfc3c424d74e479"
};
```

### 5. **Iniciar servidor**
```bash
# Desarrollo
npm run dev
# o
node index.js

# Producción
npm start
```

## 🌐 URLs de Acceso

| Ambiente | URL | Estado |
|----------|-----|---------|
| **Local** | `http://localhost:3300` | ✅ Funcional |
| **Producción** | `https://hexodus-backend.vercel.app` | ✅ Desplegado |

## 📚 Documentación de API

### 🔐 **Autenticación**

#### Headers requeridos para rutas protegidas:
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### **POST /auth/login** - Iniciar sesión
```bash
curl -X POST "https://hexodus-backend.vercel.app/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@hexodus.com",
    "password": "123456"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "firebase_user_id",
      "email": "demo@hexodus.com",
      "nombre": "Usuario Demo",
      "telefono": "1234567890",
      "rol": "admin",
      "status": "activo"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "message": "Login exitoso"
}
```

#### **POST /auth/register** - Registrar usuario
```bash
curl -X POST "https://hexodus-backend.vercel.app/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nuevo@hexodus.com",
    "password": "123456",
    "nombre": "Usuario Nuevo",
    "telefono": "",
    "rol": "vendedor"
  }'
```

**Nota sobre teléfonos:**
- Campo opcional: si se envía vacío, se guarda como "sin telefono"
- Si se ingresa parcialmente (menos de 10 dígitos), se valida y rechaza
- Debe ser exactamente 10 dígitos numéricos o estar vacío

---

### 👥 **Gestión de Usuarios**

#### **GET /auth/users** - Listar usuarios (solo admins)
```bash
curl -X GET "https://hexodus-backend.vercel.app/auth/users?page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

**Parámetros de consulta:**
- `page`: Número de página (default: 1)
- `limit`: Elementos por página (default: 10)
- `status`: Filtrar por estado (`activo`, `inactivo`)
- `rol`: Filtrar por rol (`admin`, `vendedor`)
- `search`: Buscar por nombre, email o teléfono

#### **PUT /auth/users/:userId** - Actualizar usuario
```bash
curl -X PUT "https://hexodus-backend.vercel.app/auth/users/USER_ID" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Nombre Actualizado",
    "telefono": "9876543210",
    "rol": "admin",
    "status": "activo"
  }'
```

#### **PATCH /auth/users/:userId/status** - Cambiar estado
```bash
curl -X PATCH "https://hexodus-backend.vercel.app/auth/users/USER_ID/status" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "inactivo"}'
```

---

### 📦 **Gestión de Productos**

#### **Estructura de Producto**
```json
{
  "id": "firebase_document_id",
  "uuid_producto": "unique_generated_id",
  "codigo_producto": "PROD001", 
  "nombre_producto": "Proteína Whey",
  "descripcion": "Descripción del producto",
  "costo": 25.50,
  "precio": 45.99,
  "status_producto": "en stock", // o "agotado"
  "fecha_creacion": "firebase_timestamp",
  "fecha_actualizacion": "firebase_timestamp",
  "id_usuario": "user_firebase_id"
}
```

#### **POST /api/products** - Crear producto
```bash
curl -X POST "https://hexodus-backend.vercel.app/api/products" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "codigo_producto": "PROD001",
    "nombre_producto": "Proteína Whey",
    "descripcion": "Proteína de suero sabor vainilla",
    "costo": 25.50,
    "precio": 45.99,
    "status_producto": "en stock"
  }'
```

#### **GET /api/products** - Listar productos
```bash
curl -X GET "https://hexodus-backend.vercel.app/api/products?page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

**Parámetros de consulta:**
- `page`: Número de página (default: 1)
- `limit`: Elementos por página (default: 10)

#### **GET /api/products/search** - Buscar productos
```bash
# Búsqueda general (busca en nombre, código y descripción)
curl -X GET "https://hexodus-backend.vercel.app/api/products/search?search=proteina" \
  -H "Authorization: Bearer <token>"

# Búsqueda específica por nombre
curl -X GET "https://hexodus-backend.vercel.app/api/products/search?nombre=Vitamina" \
  -H "Authorization: Bearer <token>"

# Búsqueda específica por código
curl -X GET "https://hexodus-backend.vercel.app/api/products/search?codigo=PROD" \
  -H "Authorization: Bearer <token>"
```

**Características de búsqueda:**
- ✅ Case-insensitive (no importan mayúsculas/minúsculas)
- ✅ Búsqueda parcial (encuentra coincidencias parciales)
- ✅ Multi-campo (busca en nombre, código y descripción)

#### **GET /api/products/filter** - Filtrar productos
```bash
# Filtrar por status
curl -X GET "https://hexodus-backend.vercel.app/api/products/filter?status=en%20stock" \
  -H "Authorization: Bearer <token>"

# Filtrar por rango de precio
curl -X GET "https://hexodus-backend.vercel.app/api/products/filter?precio_min=20&precio_max=50" \
  -H "Authorization: Bearer <token>"

# Filtros combinados
curl -X GET "https://hexodus-backend.vercel.app/api/products/filter?status=en%20stock&precio_min=15&precio_max=25" \
  -H "Authorization: Bearer <token>"
```

#### **PUT /api/products/:id** - Actualizar producto
```bash
curl -X PUT "https://hexodus-backend.vercel.app/api/products/PRODUCT_ID" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "precio": 49.99,
    "descripcion": "Descripción actualizada",
    "status_producto": "agotado"
  }'
```

#### **DELETE /api/products/:id** - Eliminar producto
```bash
curl -X DELETE "https://hexodus-backend.vercel.app/api/products/PRODUCT_ID" \
  -H "Authorization: Bearer <token>"
```

---

## 🔧 **Estructura del Proyecto**

```
hexodus-backend/
├── 📁 config/
│   └── firebase-config.js      # Configuración Firebase
├── 📁 controllers/
│   ├── authController.js       # Gestión de usuarios y auth
│   └── productsController.js   # Gestión de productos
├── 📁 middleware/
│   ├── auth.js                 # Middleware de autenticación
│   └── validation.js           # Middleware de validación
├── 📁 routes/
│   ├── authRoutes.js          # Rutas de autenticación
│   └── productsRoutes.js      # Rutas de productos
├── index.js                   # Punto de entrada principal
├── package.json               # Dependencias y scripts
├── vercel.json               # Configuración de deployment
└── README.md                 # Documentación
```

## 🗄️ **Base de Datos Firebase**

### **Colección: usuarios**
```javascript
{
  uid: "firebase_auth_uid",
  email: "usuario@email.com", 
  nombre: "Nombre Usuario",
  telefono: "1234567890", // o "sin telefono"
  rol: "admin", // o "vendedor"
  status: "activo", // o "inactivo"
  fecha_creacion: timestamp,
  ultimo_acceso: timestamp,
  fecha_actualizacion: timestamp
}
```

### **Colección: productos**
```javascript
{
  uuid_producto: "generated_unique_id",
  codigo_producto: "PROD001",
  nombre_producto: "Nombre del Producto",
  descripcion: "Descripción opcional",
  costo: 25.50,
  precio: 45.99, 
  status_producto: "en stock", // o "agotado"
  id_usuario: "owner_user_id",
  fecha_creacion: timestamp,
  fecha_actualizacion: timestamp
}
```

## 🛡️ **Seguridad y Validación**

### **Validaciones Implementadas**

#### **Usuarios:**
- Email: Formato válido requerido
- Contraseña: Mínimo 6 caracteres
- Nombre: Mínimo 2 caracteres
- Teléfono: 10 dígitos numéricos o vacío
- Rol: Solo 'admin' o 'vendedor'

#### **Productos:**
- Código: Requerido, único por usuario
- Nombre: Mínimo 2 caracteres
- Precios: Números positivos
- Status: Solo 'en stock' o 'agotado'

### **Permisos por Rol**

| Acción | Admin | Vendedor |
|--------|-------|----------|
| Ver usuarios | ✅ | ❌ |
| Crear usuarios | ✅ | ❌ |
| Editar usuarios | ✅ | Solo propio perfil |
| Cambiar estados | ✅ | ❌ |
| CRUD productos | ✅ | ✅ |
| Ver todos productos | ✅ | Solo propios |

## 🚀 **Deployment**

### **Variables de Entorno en Producción**
```env
JWT_SECRET=your-super-secure-jwt-secret
NODE_ENV=production
```

### **Configuración Vercel**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.js"
    }
  ]
}
```

## 📊 **Códigos de Estado HTTP**

| Código | Significado | Uso |
|--------|-------------|-----|
| **200** | OK | Operaciones exitosas |
| **201** | Created | Recursos creados |
| **400** | Bad Request | Validación fallida |
| **401** | Unauthorized | Token inválido/ausente |
| **403** | Forbidden | Sin permisos |
| **404** | Not Found | Recurso no encontrado |
| **409** | Conflict | Duplicado (email/código) |
| **500** | Server Error | Error interno |

## 🐛 **Debugging y Logs**

### **Logs del Sistema**
El servidor genera logs detallados:
```
[Auth] Usuario logueado: email
[Products] Productos obtenidos: cantidad
[Search] Búsqueda: término -> resultados
[Error] Descripción del error
```

### **Testing con curl**
```bash
# Verificar salud del servidor
curl https://hexodus-backend.vercel.app

# Login y obtener token
TOKEN=$(curl -s -X POST "https://hexodus-backend.vercel.app/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@hexodus.com","password":"123456"}' \
  | jq -r '.data.token')

# Usar token en peticiones
curl -X GET "https://hexodus-backend.vercel.app/api/products" \
  -H "Authorization: Bearer $TOKEN"
```

## 🤝 **Contribución**

1. Fork del repositorio
2. Crear branch: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -am 'Agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Pull Request

## 📄 **Licencia**

Este proyecto está bajo la licencia MIT. Ver archivo `LICENSE` para más detalles.

---

## 📞 **Contacto y Soporte**

- **Repositorio**: [hexodus-project](https://github.com/Brayan-chan/hexodus-project)
- **Autor**: Brayan Chan
- **API Base**: `https://hexodus-backend.vercel.app`

**🎯 Sistema completo funcionando al 100% - Listo para producción** ✅
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
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 10,
      "total": 1,
      "total_pages": 1,
      "has_next_page": false,
      "has_prev_page": false
    }
  },
  "message": "Se encontraron 1 usuarios"
}
```

### 👤 Gestión Avanzada de Usuarios

#### Obtener Usuario por ID (GET /auth/users/:userId)
```bash
curl -X GET http://localhost:3300/auth/users/eBrg8JLxzsUnIKTcS2iNWWv5tng2 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

#### Actualizar Usuario (PUT /auth/users/:userId)
```bash
curl -X PUT http://localhost:3300/auth/users/eBrg8JLxzsUnIKTcS2iNWWv5tng2 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Nombre Actualizado",
    "telefono": "9999999999"
  }'
```

#### Eliminar Usuario (DELETE /auth/users/:userId) - Solo Admin
```bash
curl -X DELETE http://localhost:3300/auth/users/USER_ID \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

#### Cambiar Status de Usuario (PATCH /auth/users/:userId/status) - Solo Admin
```bash
curl -X PATCH http://localhost:3300/auth/users/USER_ID/status \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "status": "inactivo"
  }'
```

### 🔍 Búsqueda y Filtrado Avanzado

#### Filtrar por Status
```bash
curl -X GET "http://localhost:3300/auth/users?status=activo" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

#### Filtrar por Rol
```bash
curl -X GET "http://localhost:3300/auth/users?rol=vendedor" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

#### Búsqueda por Texto
```bash
# Buscar en nombre, email y teléfono
curl -X GET "http://localhost:3300/auth/users?search=Juan" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

#### Filtrado Combinado
```bash
curl -X GET "http://localhost:3300/auth/users?rol=vendedor&status=activo&search=Juan" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### 📄 Paginación y Ordenamiento

#### Paginación
```bash
# Página 1, 5 usuarios por página
curl -X GET "http://localhost:3300/auth/users?page=1&limit=5" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."

# Página 2
curl -X GET "http://localhost:3300/auth/users?page=2&limit=5" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

#### Ordenamiento
```bash
# Ordenar por nombre ascendente
curl -X GET "http://localhost:3300/auth/users?sortBy=nombre&sortOrder=asc" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."

# Ordenar por fecha de creación descendente (default)
curl -X GET "http://localhost:3300/auth/users?sortBy=fecha_creacion&sortOrder=desc" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### 📊 Parámetros de Query Disponibles

| Parámetro | Tipo | Descripción | Valores |
|-----------|------|-------------|---------|
| `page` | number | Número de página (default: 1) | 1, 2, 3... |
| `limit` | number | Usuarios por página (default: 10) | 1-100 |
| `status` | string | Filtrar por status | `activo`, `inactivo` |
| `rol` | string | Filtrar por rol | `admin`, `vendedor` |
| `search` | string | Buscar en nombre/email/teléfono | cualquier texto |
| `sortBy` | string | Campo para ordenar | `fecha_creacion`, `nombre`, `email` |
| `sortOrder` | string | Dirección del orden | `asc`, `desc` |

### 📋 Estructura de Respuesta con Paginación

```json
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "current_page": 1,
      "per_page": 10,
      "total": 25,
      "total_pages": 3,
      "has_next_page": true,
      "has_prev_page": false
    },
    "filters": {
      "status": "activo",
      "rol": null,
      "search": null,
      "sortBy": "fecha_creacion",
      "sortOrder": "desc"
    }
  },
  "message": "Se encontraron 25 usuarios"
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

## 🔒 Sistema de Permisos

### Roles de Usuario

#### 👑 **Admin**
- ✅ Acceso completo a todos los endpoints
- ✅ Ver, crear, editar y eliminar cualquier usuario
- ✅ Cambiar status y roles de usuarios
- ✅ Acceder a reportes y estadísticas

#### 👤 **Vendedor**
- ✅ Ver y editar su propio perfil
- ✅ Cambiar sus datos personales (nombre, teléfono)
- ❌ No puede ver lista de otros usuarios
- ❌ No puede eliminar usuarios
- ❌ No puede cambiar roles o status

### Matriz de Permisos

| Endpoint | Admin | Vendedor |
|----------|-------|----------|
| `POST /auth/register` | ✅ | ❌ |
| `POST /auth/login` | ✅ | ✅ |
| `GET /auth/me` | ✅ | ✅ |
| `GET /auth/users` | ✅ | ❌ |
| `GET /auth/users/:id` | ✅ | ✅ (solo propio) |
| `PUT /auth/users/:id` | ✅ | ✅ (solo propio) |
| `DELETE /auth/users/:id` | ✅ | ❌ |
| `PATCH /auth/users/:id/status` | ✅ | ❌ |

## 🧪 Testing Completo

### Casos de Uso Probados ✅

1. **✅ Crear Usuarios**: Registro con validaciones
2. **✅ Login/Logout**: Autenticación JWT
3. **✅ Listado Paginado**: Con navegación completa
4. **✅ Búsqueda Avanzada**: Multi-campo (nombre, email, teléfono)
5. **✅ Filtros Múltiples**: Por rol, status, combinados
6. **✅ Ordenamiento**: Por fecha, nombre, email
7. **✅ CRUD Completo**: Crear, leer, actualizar, eliminar
8. **✅ Permisos Granulares**: Admin vs Vendedor
9. **✅ Validaciones**: Datos de entrada y business rules
10. **✅ Error Handling**: Respuestas consistentes

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
  rol: "admin|vendedor",
  status: "activo|inactivo",
  fecha_creacion: "firestore_timestamp",
  ultimo_acceso: "firestore_timestamp",
  fecha_actualizacion: "firestore_timestamp" // Opcional
}
```

### Respuesta de Usuario
```javascript
{
  uid: "string",
  email: "string",
  nombre: "string",
  telefono: "string", 
  rol: "admin|vendedor",
  status: "activo|inactivo",
  fecha_creacion: {
    type: "firestore/timestamp/1.0",
    seconds: 1763966740,
    nanoseconds: 91000000
  },
  ultimo_acceso: {
    type: "firestore/timestamp/1.0", 
    seconds: 1763968682,
    nanoseconds: 862000000
  }
}
```

### Estructura de Paginación
```javascript
{
  pagination: {
    current_page: 1,      // Página actual
    per_page: 10,         // Elementos por página  
    total: 25,            // Total de elementos
    total_pages: 3,       // Total de páginas
    has_next_page: true,  // Si hay página siguiente
    has_prev_page: false  // Si hay página anterior
  }
}
```

### Estructura de Filtros
```javascript
{
  filters: {
    status: "activo|inactivo|null",
    rol: "admin|vendedor|null", 
    search: "string|null",
    sortBy: "fecha_creacion|nombre|email",
    sortOrder: "asc|desc"
  }
}
```

## 🚀 Funcionalidades Implementadas

### ✅ **Sistema de Usuarios Completo**

#### 🔐 Autenticación
- Registro de usuarios con Firebase Auth
- Login con email/password
- JWT tokens para sesiones
- Logout seguro
- Middleware de autenticación

#### 👥 Gestión de Usuarios  
- **CRUD Completo**: Crear, leer, actualizar, eliminar
- **Búsqueda Avanzada**: Por nombre, email, teléfono
- **Filtrado Múltiple**: Por rol, status, combinable
- **Paginación Completa**: Con navegación y metadata
- **Ordenamiento**: Por fecha, nombre, email (asc/desc)
- **Permisos Granulares**: Admin vs Vendedor

#### 🛡️ Seguridad
- Validación Zod para todos los endpoints
- Protección JWT en rutas sensibles
- Control de permisos por rol
- Prevención de auto-eliminación
- Error handling robusto

#### 📊 Características Avanzadas
- Soft delete implementation
- Timestamps automáticos
- Búsqueda case-insensitive
- Filtros combinables
- Logging detallado
- Respuestas consistentes

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
curl http://localhost:3300/

# Test completo de usuarios
curl -X POST http://localhost:3300/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","nombre":"Test User","telefono":"1234567890","rol":"admin"}'

# Login y obtener token
curl -X POST http://localhost:3300/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'

# Usar token para listar usuarios
curl -X GET "http://localhost:3300/auth/users?page=1&limit=5" \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

## 📂 Estructura del Proyecto

```
hexodus-backend/
├── index.js              # Servidor principal
├── package.json           # Dependencias
├── vercel.json           # Configuración Vercel
├── test-users-crud.md    # Tests documentados
├── config/
│   └── firebase-config.js # Configuración Firebase
├── controllers/
│   └── authController.js  # Lógica completa de usuarios
├── middleware/
│   ├── auth.js           # Middleware JWT
│   └── validation.js     # Validación Zod
└── routes/
    └── authRoutes.js     # Rutas completas de usuarios
```

## 🔄 Estado del Desarrollo

### ✅ **Completado al 100%**
- Sistema de usuarios completo
- Autenticación Firebase + JWT
- CRUD con filtros y paginación
- Búsqueda avanzada multi-campo
- Sistema de permisos granular
- Validaciones robustas
- Error handling completo
- Testing exhaustivo

### 🚧 **En Desarrollo (Próximamente)**
- Sistema de socios
- Gestión de membresías
- Control de inventario
- Módulo de ventas
- Sistema de reportes
- Gestión de productos

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