import express from 'express';
import * as sociosController from '../controllers/sociosController.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyAuth);

router.post('/', sociosController.createSocio);
router.get('/', sociosController.getSocios);
router.get('/tipos-membresia', sociosController.getTiposMembresia);
router.get('/:id', sociosController.getSocioById);
router.put('/:id', sociosController.updateSocio);
router.delete('/:id', sociosController.deleteSocio);
router.patch('/:id/disable', sociosController.disableSocio);
router.patch('/:id/enable', sociosController.enableSocio);

export default router;