import express from 'express';
import * as salesController from '../controllers/salesController.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyAuth);

// 1. POST - Crear nueva venta
router.post('/', salesController.createSale);

// 2. PUT - Editar venta
router.put('/:saleId', salesController.updateSale);

// 3. DELETE - Cancelar venta
router.delete('/:saleId', salesController.deleteSale);

// 4. GET - Obtener todas las ventas con paginación
router.get('/', salesController.getSales);

// 5. GET - Buscar ventas
router.get('/search', salesController.searchSales);

// 6. GET - Filtrar ventas por status y total
router.get('/filter', salesController.filterSales);

// 7. GET - Obtener venta individual por ID (debe ir al final para evitar conflictos)
router.get('/:saleId', salesController.getSaleById);

export default router;