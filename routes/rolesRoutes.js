import express from 'express';
import * as rolesController from '../controllers/rolesController.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyAuth);

router.post('/', rolesController.createRole);
router.get('/', rolesController.getRoles);
router.put('/:id', rolesController.updateRole);
router.delete('/:id', rolesController.deleteRole);
router.patch('/:id/disable', rolesController.disableRole);
router.patch('/:id/enable', rolesController.enableRole);

export default router;