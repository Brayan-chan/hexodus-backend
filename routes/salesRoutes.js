import express from 'express';
import * as salesController from '../controllers/salesController.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyAuth);

router.post('/', salesController.createSale);
router.get('/', salesController.getSales);
router.get('/:id', salesController.getSaleById);
router.delete('/:id', salesController.deleteSale);

export default router;