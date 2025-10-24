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

## Endpoints Implementados

### Autenticación
- `POST /api/auth/signup` - Registro de usuarios
- `POST /api/auth/signin` - Inicio de sesión
- `POST /api/auth/signout` - Cierre de sesión
- `GET /api/auth/user` - Obtener información del usuario actual

### Socios
- `GET /api/socios` - Obtener lista de socios

### Membresías
- `GET /api/membresias` - Obtener lista de membresías

### Ventas
- `GET /api/ventas` - Obtener lista de ventas

### Sistema
- `GET /api/greeting` - Mensaje de bienvenida
- `GET /api/test-connection` - Prueba de conexión a Supabase

## TODO List

### Autenticación ✅
- [x] Implementar registro de usuarios
- [x] Implementar inicio de sesión
- [x] Implementar cierre de sesión
- [x] Implementar obtención de usuario actual
- [ ] Implementar recuperación de contraseña
- [ ] Implementar verificación de email

### Socios 🏋️‍♂️
- [ ] Implementar creación de socios
- [ ] Implementar actualización de socios
- [ ] Implementar eliminación de socios
- [ ] Integrar con tabla de Supabase
- [ ] Agregar validación de datos
- [ ] Implementar filtros de búsqueda
- [ ] Implementar paginación

### Membresías 💳
- [ ] Implementar creación de membresías
- [ ] Implementar actualización de membresías
- [ ] Implementar eliminación de membresías
- [ ] Integrar con tabla de Supabase
- [ ] Implementar sistema de precios
- [ ] Implementar sistema de duración
- [ ] Implementar beneficios por membresía

### Ventas 💰
- [ ] Implementar creación de ventas
- [ ] Implementar actualización de ventas
- [ ] Implementar eliminación de ventas
- [ ] Integrar con tabla de Supabase
- [ ] Implementar sistema de inventario
- [ ] Implementar registro de transacciones
- [ ] Implementar reportes de ventas

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