import express from 'express';
import * as reportsController from '../controllers/reportsController.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyAuth);

router.get('/inventory', reportsController.getInventoryReport);
router.get('/sales', reportsController.getSalesReport);
router.get('/memberships', reportsController.getMembershipsReport);
router.get('/visits', reportsController.getVisitsReport);
router.get('/movements', reportsController.getMovementsReport);

export default router;