import express from 'express';
import * as authController from '../controllers/authController.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', authController.signUp);
router.post('/signin', authController.signIn);
router.post('/refresh', authController.refreshToken);
router.get('/me', verifyAuth, authController.getCurrentUser);
router.post('/logout', verifyAuth, authController.logout);

// Rutas para gestión de usuarios
router.get('/users', verifyAuth, authController.getAllUsers);
router.put('/users/:id', verifyAuth, authController.updateUser);
router.delete('/users/:id', verifyAuth, authController.deleteUser);

export default router;