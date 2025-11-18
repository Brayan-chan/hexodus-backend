import { supabase, supabaseAdmin } from '../config/supabase-config.js';

export const getInventoryReport = async (req, res) => {
  try {
    const { data: inventory, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('status', 'activo')
      .order('nombre', { ascending: true });

    if (error) throw error;

    const report = {
      titulo: 'Reporte de Inventario',
      fecha_generacion: new Date().toISOString(),
      total_articulos: inventory?.length || 0,
      datos: inventory
    };

    res.json({
      success: true,
      data: { report }
    });
  } catch (error) {
    console.error('[Get Inventory Report Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al generar reporte de inventario',
      code: 'INVENTORY_REPORT_ERROR'
    });
  }
};

export const getSalesReport = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    let query = supabaseAdmin
      .from('ventas')
      .select(`
        *,
        detalles_venta(*)
      `)
      .eq('id_usuario', req.user.id);

    if (fecha_inicio && fecha_fin) {
      query = query
        .gte('fecha_creacion', fecha_inicio)
        .lte('fecha_creacion', fecha_fin);
    }

    const { data: ventas, error } = await query
      .order('fecha_creacion', { ascending: false });

    if (error) throw error;

    const totalVentas = ventas?.reduce((sum, venta) => sum + parseFloat(venta.monto_total || 0), 0) || 0;
    const totalItems = ventas?.reduce((sum, venta) => 
      sum + (venta.detalles_venta?.reduce((itemSum, item) => itemSum + (item.cantidad || 0), 0) || 0)
    , 0) || 0;

    const report = {
      titulo: 'Reporte de Ventas',
      fecha_generacion: new Date().toISOString(),
      fecha_inicio,
      fecha_fin,
      total_ventas: ventas?.length || 0,
      total_ingreso: totalVentas,
      total_productos: totalItems,
      datos: ventas
    };

    res.json({
      success: true,
      data: { report }
    });
  } catch (error) {
    console.error('[Get Sales Report Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al generar reporte de ventas',
      code: 'SALES_REPORT_ERROR'
    });
  }
};

export const getMembershipsReport = async (req, res) => {
  try {
    const { data: memberships, error } = await supabase
      .from('socio_memberships')
      .select('*, socios(nombre, apellido_paterno, apellido_materno), membership_types(nombre, precio)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const ingresos = memberships?.reduce((sum, m) => 
      m.status_pago === 'pagada' ? sum + m.precio_pagado : sum
    , 0) || 0;

    const report = {
      titulo: 'Reporte de Membresías',
      fecha_generacion: new Date().toISOString(),
      total_membresias: memberships?.length || 0,
      total_pagadas: memberships?.filter(m => m.status_pago === 'pagada').length || 0,
      total_pendientes: memberships?.filter(m => m.status_pago === 'pendiente').length || 0,
      ingresos_totales: ingresos,
      datos: memberships
    };

    res.json({
      success: true,
      data: { report }
    });
  } catch (error) {
    console.error('[Get Memberships Report Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al generar reporte de membresías',
      code: 'MEMBERSHIPS_REPORT_ERROR'
    });
  }
};

export const getVisitsReport = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    let query = supabase
      .from('gym_visits')
      .select('*, socios(nombre, apellido_paterno, apellido_materno)')
      .eq('user_id', req.user.id);

    if (fecha_inicio && fecha_fin) {
      query = query
        .gte('entrada_timestamp', fecha_inicio)
        .lte('entrada_timestamp', fecha_fin);
    }

    const { data: visits, error } = await query
      .order('entrada_timestamp', { ascending: false });

    if (error) throw error;

    const report = {
      titulo: 'Reporte de Visitas',
      fecha_generacion: new Date().toISOString(),
      fecha_inicio,
      fecha_fin,
      total_visitas: visits?.length || 0,
      socios_unicos: new Set(visits?.map(v => v.socio_id) || []).size,
      datos: visits
    };

    res.json({
      success: true,
      data: { report }
    });
  } catch (error) {
    console.error('[Get Visits Report Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al generar reporte de visitas',
      code: 'VISITS_REPORT_ERROR'
    });
  }
};

export const getMovementsReport = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, tipo } = req.query;

    let query = supabase
      .from('movements')
      .select('*, movement_concepts(nombre)')
      .eq('user_id', req.user.id);

    if (tipo) query = query.eq('tipo', tipo);

    if (fecha_inicio && fecha_fin) {
      query = query
        .gte('created_at', fecha_inicio)
        .lte('created_at', fecha_fin);
    }

    const { data: movements, error } = await query
      .order('created_at', { ascending: false });

    if (error) throw error;

    const totalIngresos = movements?.filter(m => m.tipo === 'ingreso')
      .reduce((sum, m) => sum + m.monto, 0) || 0;
    const totalEgresos = movements?.filter(m => m.tipo === 'egreso')
      .reduce((sum, m) => sum + m.monto, 0) || 0;

    const report = {
      titulo: 'Reporte de Movimientos',
      fecha_generacion: new Date().toISOString(),
      fecha_inicio,
      fecha_fin,
      total_ingresos: totalIngresos,
      total_egresos: totalEgresos,
      balance: totalIngresos - totalEgresos,
      datos: movements
    };

    res.json({
      success: true,
      data: { report }
    });
  } catch (error) {
    console.error('[Get Movements Report Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al generar reporte de movimientos',
      code: 'MOVEMENTS_REPORT_ERROR'
    });
  }
};