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

// Endpoint de prueba (temporal) - SIN autenticación
router.get('/users-test', async (req, res) => {
  try {
    console.log('[Users Test] Starting...');
    const { supabaseAdmin } = await import('../config/supabase-config.js');
    
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .limit(5);
    
    console.log('[Users Test] Result:', { count: data?.length, error });
    
    res.json({
      success: true,
      message: 'Test endpoint - usuarios',
      data: data,
      error: error
    });
  } catch (err) {
    console.error('[Users Test] Error:', err);
    res.status(500).json({
      success: false,
      error: err.message,
      stack: err.stack
    });
  }
});

// Endpoint para verificar token (temporal)
router.get('/verify-token', async (req, res) => {
  try {
    console.log('[Verify Token] Starting...');
    const authHeader = req.headers.authorization;
    console.log('[Verify Token] Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader) {
      return res.json({
        success: false,
        error: 'No authorization header'
      });
    }
    
    const token = authHeader.substring(7);
    const { supabase } = await import('../config/supabase-config.js');
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    res.json({
      success: !error,
      user: user ? { id: user.id, email: user.email } : null,
      error: error?.message || null,
      tokenLength: token.length
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Endpoint de prueba (temporal)
router.get('/test-db', verifyAuth, async (req, res) => {
  try {
    const { supabase } = await import('../config/supabase-config.js');
    const { data, error } = await supabase
      .from('usuarios')
      .select('count(*)');
    
    res.json({
      success: true,
      message: 'Conexión a DB exitosa',
      count: data,
      error: error
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;