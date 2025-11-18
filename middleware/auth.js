import { supabase, supabaseAdmin } from '../config/supabase-config.js';

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

    // Verificar token con Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    console.log('[Auth] Supabase auth result:', { 
      userId: user?.id || 'No user', 
      error: error?.message || 'No error' 
    });

    if (error || !user) {
      console.log('[Auth] Token validation failed:', error?.message);
      return res.status(401).json({
        success: false,
        error: 'Token inválido o expirado',
        code: 'INVALID_TOKEN'
      });
    }

    // Obtener el usuario de la tabla usuarios
    console.log('[Auth] Looking up user in usuarios table with id_auth:', user.id);
    const { data: userData, error: userError } = await supabaseAdmin
      .from('usuarios')
      .select('id, email, nombre_completo, rol')
      .eq('id_auth', user.id)
      .single();

    console.log('[Auth] User lookup result:', { 
      found: !!userData, 
      error: userError?.message || 'No error',
      userData: userData ? { id: userData.id, email: userData.email } : 'No data'
    });

    if (userError || !userData) {
      console.log('[Auth] User not found in usuarios table');
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
    
    console.log('[Auth] Authentication successful for user:', userData.email);
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