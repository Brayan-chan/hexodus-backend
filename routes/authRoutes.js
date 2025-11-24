import express from 'express';
import { 
  register, 
  login, 
  logout, 
  getCurrentUser, 
  getUsers,
  getUserById,
  updateUser,
  deleteUserById,
  toggleUserStatus
} from '../controllers/authController.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.post('/register', register);
router.post('/login', login);

// Rutas protegidas - Usuario actual
router.post('/logout', verifyAuth, logout);
router.get('/me', verifyAuth, getCurrentUser);

// Rutas protegidas - Gestión de usuarios (requiere permisos específicos)
router.get('/users', verifyAuth, getUsers); // Solo admins pueden ver todos los usuarios
router.get('/users/:userId', verifyAuth, getUserById); // Admin o propio usuario
router.put('/users/:userId', verifyAuth, updateUser); // Admin o propio usuario
router.delete('/users/:userId', verifyAuth, deleteUserById); // Solo admins
router.patch('/users/:userId/status', verifyAuth, toggleUserStatus); // Solo admins

export default router;