import express from 'express';
import { getSocios } from '../controllers/sociosController.js';

const router = express.Router();

router.get('/socios', getSocios);

export default router;