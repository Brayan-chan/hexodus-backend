import express from 'express';
import { 
  register, 
  login, 
  logout, 
  getCurrentUser, 
  getUsers 
} from '../controllers/authController.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.post('/register', register);
router.post('/login', login);

// Rutas protegidas
router.post('/logout', verifyAuth, logout);
router.get('/me', verifyAuth, getCurrentUser);
router.get('/users', verifyAuth, getUsers); // Solo admins pueden ver todos los usuarios

export default router;