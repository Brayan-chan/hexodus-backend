import express from 'express';
import * as inventoryController from '../controllers/inventoryController.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyAuth);

router.post('/', inventoryController.createInventory);
router.get('/', inventoryController.getInventory);
router.get('/:id', inventoryController.getInventoryById);
router.put('/:id', inventoryController.updateInventory);
router.delete('/:id', inventoryController.deleteInventory);

export default router;