# Hexodus Backend 🚀

Backend para la aplicación Hexodus, un sistema de gestión para gimnasios que permite administrar socios, membresías, ventas y más.

## Objetivo del Proyecto

Desarrollar una API robusta para gestionar todas las operaciones de un gimnasio, incluyendo:
- Gestión de socios y sus membresías
- Control de ventas y productos
- Sistema de autenticación y autorización
- Administración de pagos y renovaciones
- Seguimiento de asistencias

## Tecnologías Utilizadas

- Node.js
- Express
- Supabase (Base de datos y autenticación)
- dotenv (Variables de entorno)
- CORS
- Morgan (Logging)

## Instalación

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
- Crear archivo `.env` basado en `.env.example`
- Configurar las siguientes variables:
  ```
  PORT=3000
  SUPABASE_KEY=tu_llave_de_supabase
  ```

4. Iniciar el servidor:
```bash
# Desarrollo con auto-recarga
npm run dev

# Producción
npm start
```

## 📋 Endpoints y Ejemplos de Uso

### 🔐 Autenticación

#### Crear Cuenta (POST /api/auth/signup)
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "contraseña123",
    "first_name": "Primer",
    "last_name": "Apellido"
  }'
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Cuenta creada exitosamente",
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "usuario@ejemplo.com",
      "role": "authenticated"
    }
  }
}
```

#### Iniciar Sesión (POST /api/auth/signin)
```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "contraseña123"
  }'
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "usuario@ejemplo.com",
      "role": "authenticated"
    },
    "session": {
      "access_token": "tu-token-jwt",
      "expires_at": 1762224463
    }
  }
}
```

#### Cerrar Sesión (POST /api/auth/signout)
```bash
curl -X POST http://localhost:3000/api/auth/signout \
  -H "Authorization: Bearer tu-token-jwt"
```

### 👥 Socios

#### Obtener Lista de Socios (GET /api/socios)
```bash
curl -X GET http://localhost:3000/api/socios \
  -H "Authorization: Bearer tu-token-jwt"
```

#### Crear Nuevo Socio (POST /api/socios)
```bash
curl -X POST http://localhost:3000/api/socios \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu-token-jwt" \
  -d '{
    "nombre": "Juan",
    "apellidos": "Pérez González",
    "status_membership": "activo"
  }'
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Socio creado exitosamente",
  "data": {
    "id": "uuid-del-socio",
    "nombre": "Juan",
    "apellidos": "Pérez González",
    "status_membership": "activo",
    "fecha_creacion": "2025-11-03T19:57:10.999Z",
    "user_id": "uuid-del-usuario"
  }
}
```

### 💰 Ventas

#### Obtener Lista de Ventas (GET /api/ventas)
```bash
curl -X GET http://localhost:3000/api/ventas \
  -H "Authorization: Bearer tu-token-jwt"
```

#### Crear Nueva Venta (POST /api/ventas)
```bash
curl -X POST http://localhost:3000/api/ventas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu-token-jwt" \
  -d '{
    "producto": "Membresía Mensual",
    "cantidad": 1,
    "precio": 500
  }'
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Venta registrada exitosamente",
  "data": {
    "id": "uuid-de-la-venta",
    "producto": "Membresía Mensual",
    "cantidad": 1,
    "precio": 500,
    "fecha_venta": "2025-11-03T19:58:34.027Z",
    "user_id": "uuid-del-usuario"
  }
}
```

### 📦 Inventario

#### Crear Nuevo Producto (POST /api/inventario)
```bash
curl -X POST http://localhost:3000/api/inventario \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu-token-jwt" \
  -d '{
    "nombre": "Proteína Whey",
    "stock": 50,
    "precio": 799.99,
    "tipo": "Suplemento",
    "proveedor": "MyProtein",
    "duración": 365
  }'
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Producto registrado exitosamente",
  "data": {
    "id": "uuid-del-producto",
    "nombre": "Proteína Whey",
    "stock": 50,
    "precio": 799.99,
    "tipo": "Suplemento",
    "proveedor": "MyProtein",
    "duración": 365,
    "fecha_creacion": "2025-11-04T01:48:13.003Z",
    "user_id": "uuid-del-usuario"
  }
}
```

### 🔄 Sistema

#### Mensaje de Bienvenida (GET /api/greeting)
```bash
curl -X GET http://localhost:3000/api/greeting
```

#### Prueba de Conexión (GET /api/test-connection)
```bash
curl -X GET http://localhost:3000/api/test-connection \
  -H "Authorization: Bearer tu-token-jwt"
```

## Headers Requeridos

Para rutas protegidas:
```
Authorization: Bearer tu-token-jwt
Content-Type: application/json
```

## Códigos de Respuesta

- 200: Operación exitosa
- 201: Recurso creado exitosamente
- 400: Error en la solicitud
- 401: No autorizado
- 403: Prohibido
- 404: Recurso no encontrado
- 500: Error interno del servidor

## TODO List

### Autenticación ✅
- [x] Implementar registro de usuarios
- [x] Implementar inicio de sesión
- [x] Implementar cierre de sesión
- [x] Implementar obtención de usuario actual
- [ ] Implementar recuperación de contraseña
- [ ] Implementar verificación de email

### Socios 🏋️‍♂️
- [x] Implementar creación de socios
- [ ] Implementar actualización de socios
- [ ] Implementar eliminación de socios
- [ ] Integrar con tabla de Supabase
- [ ] Agregar validación de datos
- [ ] Implementar filtros de búsqueda
- [ ] Implementar paginación

### Membresías 💳
- [x] Implementar creación de membresías
- [ ] Implementar actualización de membresías
- [ ] Implementar eliminación de membresías
- [ ] Integrar con tabla de Supabase
- [ ] Implementar sistema de precios
- [ ] Implementar sistema de duración
- [ ] Implementar beneficios por membresía

### Ventas 💰
- [x] Implementar creación de ventas
- [ ] Implementar actualización de ventas
- [ ] Implementar eliminación de ventas
- [ ] Integrar con tabla de Supabase
- [ ] Implementar sistema de inventario
- [ ] Implementar registro de transacciones
- [ ] Implementar reportes de ventas

### Inventario 📦
- [x] Implementar registro de productos

### Seguridad 🔒
- [ ] Implementar middleware de autenticación
- [ ] Implementar roles y permisos
- [ ] Implementar rate limiting
- [ ] Implementar validación de tokens
- [ ] Implementar logging de seguridad

### Base de Datos 📊
- [ ] Crear modelos de datos
- [ ] Implementar migraciones
- [ ] Configurar políticas RLS
- [ ] Implementar backups
- [ ] Optimizar consultas

### Documentación 📚
- [ ] Documentar todos los endpoints
- [ ] Crear ejemplos de uso
- [ ] Documentar esquemas de datos
- [ ] Crear guía de desarrollo
- [ ] Documentar flujos de trabajo

## Estructura del Proyecto

```
hexodus-backend/
├── config/           # Configuraciones (Supabase, etc.)
├── controllers/      # Controladores de rutas
├── routes/          # Definición de rutas
├── index.js         # Punto de entrada
├── package.json     # Dependencias y scripts
└── .env             # Variables de entorno
```

## Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## Licencia

ISC