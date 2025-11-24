import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'hexodus-secret-key-2024';

export const verifyAuth = async (req, res, next) => {
  try {
    console.log('[Auth] Starting verification...');
    const authHeader = req.headers.authorization;
    console.log('[Auth] Auth header received:', authHeader ? 'Bearer token present' : 'No auth header');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[Auth] Missing or invalid auth header format');
      return res.status(401).json({
        success: false,
        error: 'Token de autenticación no proporcionado',
        code: 'MISSING_AUTH_TOKEN'
      });
    }

    const token = authHeader.substring(7);
    console.log('[Auth] Token extracted, length:', token.length);

    // Verificar JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('[Auth] JWT verification successful for user:', decoded.id);

    // Agregar información del usuario al request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      nombre: decoded.nombre,
      rol: decoded.rol
    };

    console.log('[Auth] User authenticated:', { 
      id: req.user.id, 
      email: req.user.email,
      rol: req.user.rol 
    });

    next();

  } catch (error) {
    console.error('[Auth] Verification failed:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error en verificación de autenticación',
      code: 'AUTH_ERROR'
    });
  }
};

// Middleware para verificar roles específicos
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para esta acción',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

// Alias para mantener compatibilidad
export const authenticateToken = verifyAuth;