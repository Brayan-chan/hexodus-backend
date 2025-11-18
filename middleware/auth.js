import { supabase, supabaseAdmin } from '../config/supabase-config.js';

export const verifyAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticación no proporcionado',
        code: 'MISSING_AUTH_TOKEN'
      });
    }

    const token = authHeader.substring(7);

    // Verificar token con Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido o expirado',
        code: 'INVALID_TOKEN'
      });
    }

    // Obtener el usuario de la tabla usuarios
    const { data: userData, error: userError } = await supabaseAdmin
      .from('usuarios')
      .select('id, email, nombre_completo, rol')
      .eq('id_auth', user.id)
      .single();

    if (userError || !userData) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no encontrado en el sistema',
        code: 'USER_NOT_FOUND'
      });
    }

    // Agregar usuario del sistema al request
    req.user = {
      id: userData.id,
      authId: user.id,
      email: userData.email,
      fullName: userData.nombre_completo,
      rol: userData.rol
    };
    
    next();
  } catch (error) {
    console.error('[Auth Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error en autenticación',
      code: 'AUTH_ERROR'
    });
  }
};

export const errorHandler = (err, req, res, next) => {
  console.error('[Error]', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';
  const code = err.code || 'INTERNAL_ERROR';

  res.status(statusCode).json({
    success: false,
    error: message,
    code
  });
};