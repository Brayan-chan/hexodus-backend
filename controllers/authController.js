import { supabase, supabaseAdmin } from '../config/supabase-config.js';
import { z } from 'zod';

// Validación de esquemas
const signUpSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
  fullName: z.string().min(2, 'Nombre requerido'),
  telefono: z.string().optional().nullable(),
  rol: z.string().optional()
});

const signInSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Contraseña requerida')
});

export const signUp = async (req, res) => {
  try {
    const { email, password, fullName, telefono, rol } = signUpSchema.parse(req.body);

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
          telefono: telefono || null,
          rol: rol || 'usuario' // Usar el rol del frontend o 'usuario' por defecto
        });

      if (userError) {
        console.error('[User Insert Error]', userError.message);
        // El usuario de auth ya existe, pero falló insertar en usuarios
        // Podrías decidir si esto es crítico o no
        throw new Error(`Usuario creado en auth pero falló insertar en tabla usuarios: ${userError.message}`);
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

export const getAllUsers = async (req, res) => {
  try {
    console.log('[Get All Users] Starting request...');
    console.log('[Get All Users] User from middleware:', req.user);
    
    const { status, rol } = req.query;
    console.log('[Get All Users] Query params:', { status, rol });

    // Usar supabaseAdmin para evitar problemas de RLS
    const { data: usuarios, error } = await supabaseAdmin
      .from('usuarios')
      .select('*');

    console.log('[Get All Users] Raw query result:', { 
      count: usuarios?.length || 0, 
      error,
      firstUser: usuarios?.[0] || 'No users'
    });

    if (error) {
      console.error('[Get All Users Supabase Error]', error);
      return res.status(500).json({
        success: false,
        error: `Database error: ${error.message}`,
        code: 'SUPABASE_ERROR',
        details: error
      });
    }

    // Aplicar filtros manualmente si existen usuarios
    let filteredUsers = usuarios || [];
    if (status && filteredUsers.length > 0) {
      filteredUsers = filteredUsers.filter(u => u.status === status);
    }
    if (rol && filteredUsers.length > 0) {
      filteredUsers = filteredUsers.filter(u => u.rol === rol);
    }

    console.log('[Get All Users] Sending response:', {
      totalUsers: usuarios?.length || 0,
      filteredUsers: filteredUsers.length,
      success: true
    });

    res.json({
      success: true,
      data: { usuarios: filteredUsers }
    });

  } catch (error) {
    console.error('[Get All Users Catch Error]', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
      stack: error.stack
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    // To-do: Agregar el campo de status a la base de datos
    const { nombre_completo, telefono, rol } = req.body;

    const updateData = {};
    if (nombre_completo !== undefined) updateData.nombre_completo = nombre_completo;
    if (telefono !== undefined) updateData.telefono = telefono || null;
    if (rol) updateData.rol = rol;

    const { data: usuario, error } = await supabaseAdmin
      .from('usuarios')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: { usuario },
      message: 'Usuario actualizado correctamente'
    });
  } catch (error) {
    console.error('[Update User Error]', error.message);
    res.status(400).json({
      success: false,
      error: error.message || 'Error al actualizar usuario',
      code: 'UPDATE_USER_ERROR'
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Usuario eliminado correctamente'
    });
  } catch (error) {
    console.error('[Delete User Error]', error.message);
    res.status(400).json({
      success: false,
      error: error.message || 'Error al eliminar usuario',
      code: 'DELETE_USER_ERROR'
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