import express from 'express';
import { testConnection } from '../controllers/testController.js';

const router = express.Router();

router.get('/test-connection', testConnection);

export default router;