import express from 'express';
import * as reportsController from '../controllers/reportsController.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(verifyAuth);

// Rutas para generar reportes
router.get('/inventory', reportsController.getInventoryReport);
router.get('/sales', reportsController.getSalesReport);
router.get('/memberships', reportsController.getMembershipsReport);
router.get('/users', reportsController.getUsersReport);
router.get('/socios', reportsController.getSociosReport);

// Rutas para gestión de reportes
router.get('/history', reportsController.getReportsHistory);
router.get('/:id', reportsController.getReportById);

export default router;