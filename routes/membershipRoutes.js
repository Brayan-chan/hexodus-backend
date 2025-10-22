import express from 'express';
import { getMemberships } from '../controllers/membershipController.js';

const router = express.Router();

router.get('/membresias', getMemberships);

export default router;