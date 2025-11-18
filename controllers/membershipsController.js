import { supabase, supabaseAdmin } from '../config/supabase-config.js';
import { z } from 'zod';

const createMembershipTypeSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  precio: z.number().positive('Precio debe ser positivo'),
  tipo: z.enum(['dias', 'semanal', 'mensual', 'trimestral', 'semestral', 'anual']),
  duracion_meses: z.number().nonnegative().default(0),
  duracion_semanas: z.number().nonnegative().default(0),
  duracion_dias: z.number().nonnegative().default(0),
  estado: z.enum(['activo', 'inactivo']).default('activo'),
  descripcion: z.string().optional().nullable()
});

const createMembershipSchema = z.object({
  id_socio: z.string().uuid('ID de socio inválido'),
  id_tipo_membresia: z.string().uuid('ID de tipo de membresía inválido'),
  fecha_inicio: z.string().datetime('Fecha de inicio inválida'),
  fecha_vencimiento: z.string().datetime('Fecha de vencimiento inválida'),
  precio_pagado: z.number().positive('Precio debe ser positivo'),
  estado_pago: z.enum(['pagada', 'sin_pagar', 'parcial']).default('sin_pagar')
});

export const createMembershipType = async (req, res) => {
  try {
    const data = createMembershipTypeSchema.parse(req.body);

    const { data: tipoMembresia, error } = await supabase
      .from('tipos_membresia')
      .insert({
        ...data,
        id_usuario: req.user.id
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: { tipoMembresia }
    });
  } catch (error) {
    console.error('[Create Membership Type Error]', error.message);
    res.status(400).json({
      success: false,
      error: error.message || 'Error al crear tipo de membresía',
      code: 'CREATE_MEMBERSHIP_TYPE_ERROR'
    });
  }
};

export const getMembershipTypes = async (req, res) => {
  try {
    const { estado } = req.query;

    let query = supabaseAdmin
      .from('tipos_membresia')
      .select('*');

    if (estado) query = query.eq('estado', estado);

    const { data: tiposMembresia, error } = await query
      .order('nombre', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: { tiposMembresia }
    });
  } catch (error) {
    console.error('[Get Membership Types Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al obtener tipos de membresía',
      code: 'GET_MEMBERSHIP_TYPES_ERROR'
    });
  }
};

export const updateMembershipType = async (req, res) => {
  try {
    const { id } = req.params;
    const data = createMembershipTypeSchema.partial().parse(req.body);

    const { data: tipoMembresia, error } = await supabase
      .from('tipos_membresia')
      .update(data)
      .eq('id', id)
      .eq('id_usuario', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: { tipoMembresia }
    });
  } catch (error) {
    console.error('[Update Membership Type Error]', error.message);
    res.status(400).json({
      success: false,
      error: error.message || 'Error al actualizar tipo de membresía',
      code: 'UPDATE_MEMBERSHIP_TYPE_ERROR'
    });
  }
};

export const deleteMembershipType = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('tipos_membresia')
      .delete()
      .eq('id', id)
      .eq('id_usuario', req.user.id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Tipo de membresía eliminado'
    });
  } catch (error) {
    console.error('[Delete Membership Type Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar tipo de membresía',
      code: 'DELETE_MEMBERSHIP_TYPE_ERROR'
    });
  }
};

export const createMembership = async (req, res) => {
  try {
    const data = createMembershipSchema.parse(req.body);

    const { data: membresia, error } = await supabaseAdmin
      .from('membresias')
      .insert({
        ...data,
        id_usuario: req.user.id
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: { membresia }
    });
  } catch (error) {
    console.error('[Create Membership Error]', error.message);
    res.status(400).json({
      success: false,
      error: error.message || 'Error al crear membresía',
      code: 'CREATE_MEMBERSHIP_ERROR'
    });
  }
};

export const getMemberships = async (req, res) => {
  try {
    const { id_socio } = req.query;

    let query = supabase
      .from('membresias')
      .select(`*, tipos_membresia(*)`)
      .eq('id_usuario', req.user.id);

    if (id_socio) query = query.eq('id_socio', id_socio);

    const { data: membresias, error } = await query
      .order('fecha_inicio', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: { membresias }
    });
  } catch (error) {
    console.error('[Get Memberships Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al obtener membresías',
      code: 'GET_MEMBERSHIPS_ERROR'
    });
  }
};

export const updateMembership = async (req, res) => {
  try {
    const { id } = req.params;
    const data = createMembershipSchema.partial().parse(req.body);

    const { data: membresia, error } = await supabase
      .from('membresias')
      .update(data)
      .eq('id', id)
      .eq('id_usuario', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: { membresia }
    });
  } catch (error) {
    console.error('[Update Membership Error]', error.message);
    res.status(400).json({
      success: false,
      error: error.message || 'Error al actualizar membresía',
      code: 'UPDATE_MEMBERSHIP_ERROR'
    });
  }
};

export const deleteMembership = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('membresias')
      .delete()
      .eq('id', id)
      .eq('id_usuario', req.user.id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Membresía eliminada'
    });
  } catch (error) {
    console.error('[Delete Membership Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar membresía',
      code: 'DELETE_MEMBERSHIP_ERROR'
    });
  }
};

export const markMembershipAsPaid = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: membresia, error } = await supabase
      .from('membresias')
      .update({ estado_pago: 'pagada' })
      .eq('id', id)
      .eq('id_usuario', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: { membresia },
      message: 'Membresía marcada como pagada'
    });
  } catch (error) {
    console.error('[Mark Membership As Paid Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al marcar membresía como pagada',
      code: 'MARK_MEMBERSHIP_PAID_ERROR'
    });
  }
};