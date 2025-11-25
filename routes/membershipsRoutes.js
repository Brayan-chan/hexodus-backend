import express from 'express';
import * as membershipsController from '../controllers/membershipsController.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyAuth);

// 1. POST - Crear nueva membresía
router.post('/', membershipsController.createMembership);

// 2. PUT - Editar membresía
router.put('/:membershipId', membershipsController.updateMembership);

// 3. DELETE - Eliminar membresía
router.delete('/:membershipId', membershipsController.deleteMembership);

// 4. GET - Obtener todas las membresías con paginación
router.get('/', membershipsController.getMemberships);

// 5. GET - Buscar membresías
router.get('/search', membershipsController.searchMemberships);

// 6. GET - Filtrar membresías con múltiples criterios
router.get('/filter', membershipsController.filterMemberships);

// 7. GET - Filtrar membresías por status (activo, inactivo)
router.get('/filter/status', membershipsController.filterMembershipsByStatus);

// 8. GET - Filtrar membresías por tipo (mensual, semanal, etc)
router.get('/filter/type', membershipsController.filterMembershipsByType);

// 4.1. GET - Obtener detalles de una membresía específica (debe ir al final de las rutas GET)
router.get('/:membershipId', membershipsController.getMembershipById);

// 9. PUT - Habilitar membresía
router.put('/:membershipId/enable', membershipsController.enableMembership);

// 10. PUT - Deshabilitar membresía
router.put('/:membershipId/disable', membershipsController.disableMembership);

export default router;