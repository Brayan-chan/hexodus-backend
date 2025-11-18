import { supabase, supabaseAdmin } from '../config/supabase-config.js';
import { z } from 'zod';

const createProductSchema = z.object({
  codigo: z.string().min(2, 'Código requerido'),
  nombre: z.string().min(2, 'Nombre requerido'),
  descripcion: z.string().optional().nullable(),
  costo: z.number().positive('Costo debe ser positivo'),
  precio: z.number().positive('Precio debe ser positivo'),
  stock: z.number().nonnegative('Stock no puede ser negativo').default(0),
  estado: z.enum(['activo', 'inactivo']).default('activo')
});

const updateProductSchema = createProductSchema.partial();

export const createProduct = async (req, res) => {
  try {
    const data = createProductSchema.parse(req.body);

    const { data: producto, error } = await supabaseAdmin
      .from('productos')
      .insert({
        ...data,
        id_usuario: req.user.id
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: { producto }
    });
  } catch (error) {
    console.error('[Create Product Error]', error.message);
    res.status(400).json({
      success: false,
      error: error.message || 'Error al crear producto',
      code: 'CREATE_PRODUCT_ERROR'
    });
  }
};

export const getProducts = async (req, res) => {
  try {
    const { limit = 50, offset = 0, estado, search } = req.query;

    let query = supabase
      .from('productos')
      .select('*', { count: 'exact' })
      .eq('id_usuario', req.user.id);

    if (estado) query = query.eq('estado', estado);
    
    if (search) {
      query = query.or(
        `nombre.ilike.%${search}%,codigo.ilike.%${search}%,descripcion.ilike.%${search}%`
      );
    }

    const { data: productos, error, count } = await query
      .order('nombre', { ascending: true })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: { productos, total: count }
    });
  } catch (error) {
    console.error('[Get Products Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al obtener productos',
      code: 'GET_PRODUCTS_ERROR'
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: producto, error } = await supabase
      .from('productos')
      .select('*')
      .eq('id', id)
      .eq('id_usuario', req.user.id)
      .single();

    if (error) throw error;
    if (!producto) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { producto }
    });
  } catch (error) {
    console.error('[Get Product Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al obtener producto',
      code: 'GET_PRODUCT_ERROR'
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateProductSchema.parse(req.body);

    const { data: producto, error } = await supabase
      .from('productos')
      .update(data)
      .eq('id', id)
      .eq('id_usuario', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: { producto }
    });
  } catch (error) {
    console.error('[Update Product Error]', error.message);
    res.status(400).json({
      success: false,
      error: error.message || 'Error al actualizar producto',
      code: 'UPDATE_PRODUCT_ERROR'
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', id)
      .eq('id_usuario', req.user.id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Producto eliminado'
    });
  } catch (error) {
    console.error('[Delete Product Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar producto',
      code: 'DELETE_PRODUCT_ERROR'
    });
  }
};

export const disableProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: producto, error } = await supabase
      .from('productos')
      .update({ estado: 'inactivo' })
      .eq('id', id)
      .eq('id_usuario', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: { producto },
      message: 'Producto deshabilitado'
    });
  } catch (error) {
    console.error('[Disable Product Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al deshabilitar producto',
      code: 'DISABLE_PRODUCT_ERROR'
    });
  }
};

export const enableProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: producto, error } = await supabase
      .from('productos')
      .update({ estado: 'activo' })
      .eq('id', id)
      .eq('id_usuario', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: { producto },
      message: 'Producto habilitado'
    });
  } catch (error) {
    console.error('[Enable Product Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al habilitar producto',
      code: 'ENABLE_PRODUCT_ERROR'
    });
  }
};