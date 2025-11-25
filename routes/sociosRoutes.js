import express from 'express';
import * as sociosController from '../controllers/sociosController.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyAuth);

// ====== RUTAS PARA SOCIOS ======
// 1- POST crear socio
router.post('/', sociosController.createSocio);

// 2- PUT modificar socio
router.put('/:id', sociosController.updateSocio);

// 3- Deshabilitar socio
router.patch('/:id/disable', sociosController.disableSocio);

// 4- Habilitar socio
router.patch('/:id/enable', sociosController.enableSocio);

// 5- DELETE socio
router.delete('/:id', sociosController.deleteSocio);

// 8- Buscar socio por id/nombre
router.get('/search', sociosController.searchSocios);

// Filtrar socios por status (activo, inactivo)
router.get('/filter/status', sociosController.filterSociosByStatus);

// 9- Ver últimos socios del día
router.get('/latest-today', sociosController.getLatestSociosToday);

// 10- Mostrar todos los socios (sin paginación)
router.get('/all', sociosController.getAllSocios);

// 11- Contar número de socios
router.get('/count', sociosController.countSocios);

// Ver detalles de un socio en concreto
router.get('/:id', sociosController.getSocioById);

// 12- GET socios (con paginación) - debe ir al final para no conflictuar
router.get('/', sociosController.getSocios);

// ====== RUTAS PARA GESTIÓN DE MEMBRESÍAS ======
// Obtener membresías disponibles para asignar
router.get('/memberships/available', sociosController.getAvailableMemberships);

// 1- Asignar membresías al socio
router.post('/:socioId/membership', sociosController.assignMembership);

// 2- Cobrar membresías al socio
router.patch('/membership/:membresiaId/pay', sociosController.payMembership);

// 4- PUT editar membresia_socio
router.put('/membership/:membresiaId', sociosController.updateMembership);

// 5- DELETE eliminar membresia_socio
router.delete('/membership/:membresiaId', sociosController.deleteMembership);

// 6- Cambiar status en tiempo real
router.patch('/membership/update-status', sociosController.updateMembershipStatus);

// Obtener todas las membresías de un socio
router.get('/:socioId/memberships', sociosController.getMembershipsBySocio);

export default router;