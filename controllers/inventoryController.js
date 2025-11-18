import { supabase, supabaseAdmin } from '../config/supabase-config.js';
import { z } from 'zod';

const createInventorySchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  stock: z.number().nonnegative('Stock no puede ser negativo'),
  precio: z.number().positive('Precio debe ser positivo'),
  tipo: z.string().min(2, 'Tipo requerido'),
  proveedor: z.string().min(2, 'Proveedor requerido'),
  duracion: z.number().positive('Duración debe ser positiva').optional().nullable(),
  status: z.enum(['activo', 'inactivo']).default('activo')
});

const updateInventorySchema = createInventorySchema.partial();

export const createInventory = async (req, res) => {
  try {
    const data = createInventorySchema.parse(req.body);

    const { data: inventory, error } = await supabaseAdmin
      .from('inventory')
      .insert({
        ...data,
        id_usuario: req.user.id
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: { inventory }
    });
  } catch (error) {
    console.error('[Create Inventory Error]', error.message);
    res.status(400).json({
      success: false,
      error: error.message || 'Error al crear artículo de inventario',
      code: 'CREATE_INVENTORY_ERROR'
    });
  }
};

export const getInventory = async (req, res) => {
  try {
    const { limit = 50, offset = 0, tipo, status, search } = req.query;

    let query = supabase
      .from('inventory')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id);

    if (tipo) query = query.eq('tipo', tipo);
    if (status) query = query.eq('status', status);

    if (search) {
      query = query.or(
        `nombre.ilike.%${search}%,proveedor.ilike.%${search}%`
      );
    }

    const { data: inventory, error, count } = await query
      .order('nombre', { ascending: true })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: { inventory, total: count }
    });
  } catch (error) {
    console.error('[Get Inventory Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al obtener inventario',
      code: 'GET_INVENTORY_ERROR'
    });
  }
};

export const getInventoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: item, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error) throw error;
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Artículo no encontrado',
        code: 'INVENTORY_ITEM_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { item }
    });
  } catch (error) {
    console.error('[Get Inventory Item Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al obtener artículo',
      code: 'GET_INVENTORY_ITEM_ERROR'
    });
  }
};

export const updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateInventorySchema.parse(req.body);

    const { data: item, error } = await supabase
      .from('inventory')
      .update(data)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: { item }
    });
  } catch (error) {
    console.error('[Update Inventory Error]', error.message);
    res.status(400).json({
      success: false,
      error: error.message || 'Error al actualizar artículo',
      code: 'UPDATE_INVENTORY_ERROR'
    });
  }
};

export const deleteInventory = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Artículo eliminado'
    });
  } catch (error) {
    console.error('[Delete Inventory Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar artículo',
      code: 'DELETE_INVENTORY_ERROR'
    });
  }
};