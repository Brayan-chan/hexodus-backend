import { supabase, supabaseAdmin } from '../config/supabase-config.js';
import { z } from 'zod';

const saleItemSchema = z.object({
  id_producto: z.string().uuid('ID de producto inválido'),
  cantidad: z.number().positive('Cantidad debe ser positiva'),
  precio_unitario: z.number().positive('Precio unitario debe ser positivo')
});

const createSaleSchema = z.object({
  items: z.array(saleItemSchema).min(1, 'Debe incluir al menos un producto'),
  metodo_pago: z.enum(['efectivo', 'tarjeta', 'transferencia']),
  monto_total: z.number().positive('Total debe ser positivo'),
  notas: z.string().optional().nullable(),
  id_socio: z.string().uuid().optional().nullable()
});

export const createSale = async (req, res) => {
  try {
    const { items, metodo_pago, monto_total, notas, id_socio } = createSaleSchema.parse(req.body);

    // Generar número de venta
    const numeroVenta = `VTA-${Date.now()}`;

    const { data: venta, error: ventaError } = await supabaseAdmin
      .from('ventas')
      .insert({
        id_usuario: req.user.id,
        numero_venta: numeroVenta,
        id_socio,
        metodo_pago,
        monto_total,
        notas,
        estado: 'activo'
      })
      .select()
      .single();

    if (ventaError) throw ventaError;

    // Insertar detalles de venta
    const detallesVenta = items.map(item => ({
      id_venta: venta.id,
      id_producto: item.id_producto,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      subtotal: item.cantidad * item.precio_unitario
    }));

    const { error: detallesError } = await supabaseAdmin
      .from('detalles_venta')
      .insert(detallesVenta);

    if (detallesError) throw detallesError;

    // Actualizar stock de productos
    for (const item of items) {
      const { data: producto, error: getError } = await supabaseAdmin
        .from('productos')
        .select('stock')
        .eq('id', item.id_producto)
        .eq('id_usuario', req.user.id)
        .single();

      if (getError) throw getError;

      const nuevoStock = producto.stock - item.cantidad;

      const { error: updateError } = await supabaseAdmin
        .from('productos')
        .update({ stock: Math.max(0, nuevoStock) })
        .eq('id', item.id_producto)
        .eq('id_usuario', req.user.id);

      if (updateError) throw updateError;
    }

    // Registrar movimiento contable
    const { data: conceptoVenta } = await supabaseAdmin
      .from('conceptos_movimientos')
      .select('id')
      .eq('nombre', 'Venta de Producto')
      .single();

    if (conceptoVenta) {
      const { error: movementError } = await supabaseAdmin
        .from('movimientos_caja')
        .insert({
          id_usuario: req.user.id,
          id_concepto: conceptoVenta.id,
          monto: monto_total,
          metodo_pago,
          notas: `Venta #${numeroVenta}`,
          datos_referencia: { id_venta: venta.id }
        });

      if (movementError) console.warn('Warning: No se registró movimiento contable');
    }

    res.status(201).json({
      success: true,
      data: { 
        venta: {
          ...venta,
          items
        }
      }
    });
  } catch (error) {
    console.error('[Create Sale Error]', error.message);
    res.status(400).json({
      success: false,
      error: error.message || 'Error al crear venta',
      code: 'CREATE_SALE_ERROR'
    });
  }
};

export const getSales = async (req, res) => {
  try {
    const { limit = 50, offset = 0, estado, fecha_inicio, fecha_fin } = req.query;

    let query = supabase
      .from('ventas')
      .select('*, detalles_venta(*)', { count: 'exact' })
      .eq('id_usuario', req.user.id);

    if (estado) query = query.eq('estado', estado);

    if (fecha_inicio && fecha_fin) {
      query = query
        .gte('fecha_creacion', fecha_inicio)
        .lte('fecha_creacion', fecha_fin);
    }

    const { data: ventas, error, count } = await query
      .order('fecha_creacion', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: { ventas, total: count }
    });
  } catch (error) {
    console.error('[Get Sales Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al obtener ventas',
      code: 'GET_SALES_ERROR'
    });
  }
};

export const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: venta, error } = await supabase
      .from('ventas')
      .select('*, detalles_venta(*, productos(*))')
      .eq('id', id)
      .eq('id_usuario', req.user.id)
      .single();

    if (error) throw error;
    if (!venta) {
      return res.status(404).json({
        success: false,
        error: 'Venta no encontrada',
        code: 'SALE_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { venta }
    });
  } catch (error) {
    console.error('[Get Sale Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al obtener venta',
      code: 'GET_SALE_ERROR'
    });
  }
};

export const deleteSale = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener detalles de venta para restaurar stock
    const { data: detallesVenta, error: getItemsError } = await supabase
      .from('detalles_venta')
      .select('id_producto, cantidad')
      .eq('id_venta', id);

    if (getItemsError) throw getItemsError;

    // Restaurar stock
    for (const item of detallesVenta || []) {
      const { data: producto, error: getError } = await supabase
        .from('productos')
        .select('stock')
        .eq('id', item.id_producto)
        .eq('id_usuario', req.user.id)
        .single();

      if (getError) throw getError;

      const { error: updateError } = await supabase
        .from('productos')
        .update({ stock: producto.stock + item.cantidad })
        .eq('id', item.id_producto)
        .eq('id_usuario', req.user.id);

      if (updateError) throw updateError;
    }

    // Eliminar detalles de venta
    const { error: deleteItemsError } = await supabase
      .from('detalles_venta')
      .delete()
      .eq('id_venta', id);

    if (deleteItemsError) throw deleteItemsError;

    // Eliminar venta
    const { error: deleteVentaError } = await supabase
      .from('ventas')
      .delete()
      .eq('id', id)
      .eq('id_usuario', req.user.id);

    if (deleteVentaError) throw deleteVentaError;

    res.json({
      success: true,
      message: 'Venta eliminada y stock restaurado'
    });
  } catch (error) {
    console.error('[Delete Sale Error]', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al eliminar venta',
      code: 'DELETE_SALE_ERROR'
    });
  }
};