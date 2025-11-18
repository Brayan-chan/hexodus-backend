import express from 'express';
import * as productsController from '../controllers/productsController.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyAuth);

router.post('/', productsController.createProduct);
router.get('/', productsController.getProducts);
router.get('/:id', productsController.getProductById);
router.put('/:id', productsController.updateProduct);
router.delete('/:id', productsController.deleteProduct);
router.patch('/:id/disable', productsController.disableProduct);
router.patch('/:id/enable', productsController.enableProduct);

export default router;