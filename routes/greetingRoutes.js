import express from 'express';
import { getGreeting } from '../controllers/greetingController.js';

const router = express.Router();

router.get('/greeting', getGreeting);

export default router;