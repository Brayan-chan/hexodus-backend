import express from 'express';
import { getVentas, createVenta } from '../controllers/ventasController.js';

const router = express.Router();

// Obtener todas las ventas
router.get('/ventas', getVentas);

// Crear una nueva venta
router.post('/ventas', createVenta);

export default router;