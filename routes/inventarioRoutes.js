import express from 'express';
import { createProduct } from '../controllers/inventarioController.js';

const router = express.Router();

// Crear un nuevo producto
router.post('/inventario', createProduct);

export default router;