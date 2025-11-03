import express from 'express';
import { getSocios, createSocio } from '../controllers/sociosController.js';

const router = express.Router();

// Obtener todos los socios
router.get('/socios', getSocios);

// Crear un nuevo socio
router.post('/socios', createSocio);

export default router;