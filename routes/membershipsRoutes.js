import express from 'express';
import * as membershipsController from '../controllers/membershipsController.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyAuth);

// Membership Types
router.post('/types', membershipsController.createMembershipType);
router.get('/types', membershipsController.getMembershipTypes);
router.put('/types/:id', membershipsController.updateMembershipType);
router.delete('/types/:id', membershipsController.deleteMembershipType);

// Socio Memberships
router.post('/', membershipsController.createMembership);
router.get('/', membershipsController.getMemberships);
router.put('/:id', membershipsController.updateMembership);
router.delete('/:id', membershipsController.deleteMembership);
router.patch('/:id/mark-paid', membershipsController.markMembershipAsPaid);

export default router;