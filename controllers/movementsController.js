import { supabase } from '../config/supabase-config.js';
import { z } from 'zod';

const createMovementSchema = z.object({
  tipo: z.enum(['ingreso', 'egreso']),
  concepto_id: z.string().uuid('ID de concepto inválido'),
  monto: z.number().positive('Monto debe ser positivo'),
  tipo_pago: z.enum(['efectivo', 'tarjeta', 'transferencia']).optional(),
  observaciones: z.string().optional().nullable(),
  referencia_id: z.string().optional().nullable(),
  referencia_tabla: z.string().optional().nullable()
});

const updateMovementSchema = createMovementSchema.partial();

export const createMovement = async (req, res) => {
  try {
    const data = createMovementSchema.parse(req.body);

    const { data: movement, error } = await supabase
      .from('movements')
      .insert({
        ...data,
        id_usuario: req.user.id
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: { movement }
    });
  } catch (error) {
    console.error('[Create Movement Error]', error.message);
    res.status(400).json({
      success: false,
      error: error.message || 'Error al crear movimiento',
      code: 'CREATE_MOVEMENT_ERROR'
    });
  }
};

export const getMovements = async (req, res) => {
  try {
    const { limit = 50, offset = 0, tipo, fecha_inicio, fecha_fin } = req.query;

    let query = supabase
      .from('movements')
      .select('*, movement_concepts(nombre)', { count: 'exact' })
      .eq('user_id', req.user.id);

    if (tipo) query = query.eq('tipo', tipo);

    if (fecha_inicio && fecha_fin) {
      query = query
        .gte('created_at', fecha_inicio)
        .lte('created_at', fecha_fin);
    }

    const { data: movements, error, count } = await query
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: { movements, total: count }
    });
  } catch (error) {
    console.error('[Get Movements Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al obtener movimientos',
      code: 'GET_MOVEMENTS_ERROR'
    });
  }
};

export const getMovementConcepts = async (req, res) => {
  try {
    const { data: concepts, error } = await supabase
      .from('movement_concepts')
      .select('*')
      .eq('status', 'activo')
      .order('nombre', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: { concepts }
    });
  } catch (error) {
    console.error('[Get Movement Concepts Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al obtener conceptos de movimiento',
      code: 'GET_MOVEMENT_CONCEPTS_ERROR'
    });
  }
};

export const createMovementConcept = async (req, res) => {
  try {
    const { nombre, tipo, status } = z.object({
      nombre: z.string().min(2, 'Nombre requerido'),
      tipo: z.enum(['ingreso', 'egreso']),
      status: z.enum(['activo', 'inactivo']).default('activo')
    }).parse(req.body);

    const { data: concept, error } = await supabase
      .from('movement_concepts')
      .insert({
        nombre,
        tipo,
        status
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: { concept }
    });
  } catch (error) {
    console.error('[Create Movement Concept Error]', error.message);
    res.status(400).json({
      success: false,
      error: error.message || 'Error al crear concepto',
      code: 'CREATE_MOVEMENT_CONCEPT_ERROR'
    });
  }
};

export const updateMovement = async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateMovementSchema.parse(req.body);

    const { data: movement, error } = await supabase
      .from('movements')
      .update(data)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: { movement }
    });
  } catch (error) {
    console.error('[Update Movement Error]', error.message);
    res.status(400).json({
      success: false,
      error: error.message || 'Error al actualizar movimiento',
      code: 'UPDATE_MOVEMENT_ERROR'
    });
  }
};

export const deleteMovement = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('movements')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Movimiento eliminado'
    });
  } catch (error) {
    console.error('[Delete Movement Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar movimiento',
      code: 'DELETE_MOVEMENT_ERROR'
    });
  }
};