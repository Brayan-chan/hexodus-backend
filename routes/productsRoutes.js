import express from 'express';
import * as productsController from '../controllers/productsController.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyAuth);

// 1. POST - Crear producto
router.post('/', productsController.createProduct);

// 2. PUT - Editar producto
router.put('/:productId', productsController.updateProduct);

// 3. DELETE - Eliminar producto
router.delete('/:productId', productsController.deleteProduct);

// 4. GET - Obtener productos con paginación
router.get('/', productsController.getProducts);

// 5. GET - Buscar productos por nombre o código
router.get('/search', productsController.searchProducts);

// 6. GET - Filtrar productos por status o precio
router.get('/filter', productsController.filterProducts);

// 7. GET - Obtener producto individual por ID (debe ir al final para evitar conflictos)
router.get('/:productId', productsController.getProductById);

export default router;