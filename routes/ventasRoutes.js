import express from 'express';
import { getVentas } from '../controllers/ventasController.js';

const router = express.Router();

router.get('/ventas', getVentas);

export default router;