import { supabase } from '../config/supabase-config.js';
import { z } from 'zod';

const createRoleSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  rol: z.enum(['admin', 'vendedor', 'recepcion']),
  status: z.enum(['activo', 'inactivo']).default('activo'),
  descripcion: z.string().optional().nullable()
});

const updateRoleSchema = createRoleSchema.partial();

export const createRole = async (req, res) => {
  try {
    const data = createRoleSchema.parse(req.body);

    const { data: role, error } = await supabase
      .from('roles')
      .insert({
        ...data,
        user_id: req.user.id
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: { role }
    });
  } catch (error) {
    console.error('[Create Role Error]', error.message);
    res.status(400).json({
      success: false,
      error: error.message || 'Error al crear rol',
      code: 'CREATE_ROLE_ERROR'
    });
  }
};

export const getRoles = async (req, res) => {
  try {
    const { status } = req.query;

    let query = supabase
      .from('roles')
      .select('*')
      .eq('user_id', req.user.id);

    if (status) query = query.eq('status', status);

    const { data: roles, error } = await query
      .order('nombre', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: { roles }
    });
  } catch (error) {
    console.error('[Get Roles Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al obtener roles',
      code: 'GET_ROLES_ERROR'
    });
  }
};

export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateRoleSchema.parse(req.body);

    const { data: role, error } = await supabase
      .from('roles')
      .update(data)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: { role }
    });
  } catch (error) {
    console.error('[Update Role Error]', error.message);
    res.status(400).json({
      success: false,
      error: error.message || 'Error al actualizar rol',
      code: 'UPDATE_ROLE_ERROR'
    });
  }
};

export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Rol eliminado'
    });
  } catch (error) {
    console.error('[Delete Role Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar rol',
      code: 'DELETE_ROLE_ERROR'
    });
  }
};

export const disableRole = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: role, error } = await supabase
      .from('roles')
      .update({ status: 'inactivo' })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: { role },
      message: 'Rol deshabilitado'
    });
  } catch (error) {
    console.error('[Disable Role Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al deshabilitar rol',
      code: 'DISABLE_ROLE_ERROR'
    });
  }
};

export const enableRole = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: role, error } = await supabase
      .from('roles')
      .update({ status: 'activo' })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: { role },
      message: 'Rol habilitado'
    });
  } catch (error) {
    console.error('[Enable Role Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al habilitar rol',
      code: 'ENABLE_ROLE_ERROR'
    });
  }
};