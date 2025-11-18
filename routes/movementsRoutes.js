import express from 'express';
import * as movementsController from '../controllers/movementsController.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyAuth);

router.post('/', movementsController.createMovement);
router.get('/', movementsController.getMovements);
router.get('/concepts', movementsController.getMovementConcepts);
router.post('/concepts', movementsController.createMovementConcept);
router.put('/:id', movementsController.updateMovement);
router.delete('/:id', movementsController.deleteMovement);

export default router;