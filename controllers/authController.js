import { supabase, supabaseAdmin } from '../config/supabase-config.js';
import { z } from 'zod';

// Validación de esquemas
const signUpSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
  fullName: z.string().min(2, 'Nombre requerido')
});

const signInSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Contraseña requerida')
});

export const signUp = async (req, res) => {
  try {
    const { email, password, fullName } = signUpSchema.parse(req.body);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    });

    if (error) throw error;

    // Si el usuario se registró exitosamente, crear el registro en la tabla usuarios
    if (data.user) {
      const { error: userError } = await supabaseAdmin
        .from('usuarios')
        .insert({
          id_auth: data.user.id,
          email: data.user.email,
          nombre_completo: fullName,
          rol: 'admin' // Rol por defecto
        });

      if (userError) {
        console.error('[User Insert Error]', userError.message);
        // No fallo aquí porque el usuario de auth ya existe
      }
    }

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: data.user?.id,
          email: data.user?.email,
          fullName: data.user?.user_metadata?.full_name
        },
        session: data.session ? {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token
        } : null
      },
      message: 'Usuario registrado. Verifica tu email para confirmar.'
    });
  } catch (error) {
    console.error('[Sign Up Error]', error.message);
    const status = error.status || 400;
    res.status(status).json({
      success: false,
      error: error.message || 'Error en registro',
      code: 'SIGNUP_ERROR'
    });
  }
};

export const signIn = async (req, res) => {
  try {
    const { email, password } = signInSchema.parse(req.body);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    res.json({
      success: true,
      data: {
        user: {
          id: data.user?.id,
          email: data.user?.email,
          fullName: data.user?.user_metadata?.full_name
        },
        session: {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresIn: data.session.expires_in
        }
      }
    });
  } catch (error) {
    console.error('[Sign In Error]', error.message);
    const status = error.status || 401;
    res.status(status).json({
      success: false,
      error: error.message || 'Credenciales inválidas',
      code: 'SIGNIN_ERROR'
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token requerido',
        code: 'MISSING_REFRESH_TOKEN'
      });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) throw error;

    res.json({
      success: true,
      data: {
        session: {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresIn: data.session.expires_in
        }
      }
    });
  } catch (error) {
    console.error('[Refresh Token Error]', error.message);
    res.status(401).json({
      success: false,
      error: 'No se pudo refrescar el token',
      code: 'REFRESH_TOKEN_ERROR'
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id_auth', userId)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: { usuario }
    });
  } catch (error) {
    console.error('[Get Current User Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al obtener usuario',
      code: 'GET_USER_ERROR'
    });
  }
};

export const logout = async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Sesión cerrada correctamente'
    });
  } catch (error) {
    console.error('[Logout Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al cerrar sesión',
      code: 'LOGOUT_ERROR'
    });
  }
};