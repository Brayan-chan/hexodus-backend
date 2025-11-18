import { supabase, supabaseAdmin } from '../config/supabase-config.js';
import { z } from 'zod';

const createSocioSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  apellido_paterno: z.string().min(2, 'Apellido paterno requerido'),
  apellido_materno: z.string().min(2, 'Apellido materno requerido'),
  telefono: z.string().min(10, 'Teléfono inválido'),
  email: z.string().email('Email inválido'),
  estado: z.enum(['activo', 'inactivo']).default('activo'),
  observaciones: z.string().optional().nullable()
});

const updateSocioSchema = createSocioSchema.partial();

export const createSocio = async (req, res) => {
  try {
    const data = createSocioSchema.parse(req.body);

    const { data: socio, error } = await supabaseAdmin
      .from('socios')
      .insert({
        ...data,
        id_usuario: req.user.id,
        codigo: `SOC-${Date.now()}`
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: { socio }
    });
  } catch (error) {
    console.error('[Create Socio Error]', error.message);
    res.status(400).json({
      success: false,
      error: error.message || 'Error al crear socio',
      code: 'CREATE_SOCIO_ERROR'
    });
  }
};

export const getSocios = async (req, res) => {
  try {
    const { limit = 50, offset = 0, estado, search } = req.query;

    let query = supabaseAdmin
      .from('socios')
      .select('*', { count: 'exact' })
      .eq('id_usuario', req.user.id);

    if (estado) query = query.eq('estado', estado);
    
    if (search) {
      query = query.or(
        `nombre.ilike.%${search}%,apellido_paterno.ilike.%${search}%,apellido_materno.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    const { data: socios, error, count } = await query
      .order('fecha_creacion', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: { socios, total: count }
    });
  } catch (error) {
    console.error('[Get Socios Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al obtener socios',
      code: 'GET_SOCIOS_ERROR'
    });
  }
};

export const getSocioById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: socio, error } = await supabase
      .from('socios')
      .select('*')
      .eq('id', id)
      .eq('id_usuario', req.user.id)
      .single();

    if (error) throw error;
    if (!socio) {
      return res.status(404).json({
        success: false,
        error: 'Socio no encontrado',
        code: 'SOCIO_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { socio }
    });
  } catch (error) {
    console.error('[Get Socio Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al obtener socio',
      code: 'GET_SOCIO_ERROR'
    });
  }
};

export const updateSocio = async (req, res) => {
  try {
    const { id } = req.params;
    const updateSchema = createSocioSchema.partial().refine(
      data => !('estado' in data) || ['activo', 'inactivo'].includes(data.estado)
    );
    const data = updateSchema.parse(req.body);

    const { data: socio, error } = await supabase
      .from('socios')
      .update(data)
      .eq('id', id)
      .eq('id_usuario', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: { socio }
    });
  } catch (error) {
    console.error('[Update Socio Error]', error.message);
    res.status(400).json({
      success: false,
      error: error.message || 'Error al actualizar socio',
      code: 'UPDATE_SOCIO_ERROR'
    });
  }
};

export const deleteSocio = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('socios')
      .delete()
      .eq('id', id)
      .eq('id_usuario', req.user.id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Socio eliminado correctamente'
    });
  } catch (error) {
    console.error('[Delete Socio Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar socio',
      code: 'DELETE_SOCIO_ERROR'
    });
  }
};

export const disableSocio = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: socio, error } = await supabase
      .from('socios')
      .update({ estado: 'inactivo' })
      .eq('id', id)
      .eq('id_usuario', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: { socio },
      message: 'Socio deshabilitado'
    });
  } catch (error) {
    console.error('[Disable Socio Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al deshabilitar socio',
      code: 'DISABLE_SOCIO_ERROR'
    });
  }
};

export const enableSocio = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: socio, error } = await supabase
      .from('socios')
      .update({ estado: 'activo' })
      .eq('id', id)
      .eq('id_usuario', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: { socio },
      message: 'Socio habilitado'
    });
  } catch (error) {
    console.error('[Enable Socio Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al habilitar socio',
      code: 'ENABLE_SOCIO_ERROR'
    });
  }
};