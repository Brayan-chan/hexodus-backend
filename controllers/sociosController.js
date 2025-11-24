import { supabase, supabaseAdmin } from '../config/supabase-config.js';
import { z } from 'zod';

const createSocioSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  apellido_paterno: z.string().min(2, 'Apellido paterno requerido'),
  apellido_materno: z.string().optional().nullable(), // Hacer opcional
  telefono: z.string().min(10, 'Teléfono inválido'),
  email: z.string().email('Email inválido'),
  direccion: z.string().min(5, 'Dirección requerida'),
  fecha_nacimiento: z.string().optional().nullable(),
  genero: z.string().optional().nullable(),
  contacto_emergencia: z.string().optional().nullable(),
  estado: z.enum(['activo', 'inactivo']).default('activo'),
  observaciones: z.string().optional().nullable(),
  foto_url: z.string().optional().nullable(),
  huella_url: z.string().optional().nullable(),
  // Campos para crear membresía
  tipo_membresia: z.string().min(1, 'Tipo de membresía requerido'),
  fecha_inicio: z.string().refine((date) => !isNaN(Date.parse(date)), 'Fecha de inicio inválida'),
  precio_pagado: z.number().positive('Precio debe ser positivo').optional()
});

const updateSocioSchema = createSocioSchema.partial();

export const createSocio = async (req, res) => {
  try {
    const data = createSocioSchema.parse(req.body);

    // Extraer datos de membresía
    const { tipo_membresia, fecha_inicio, precio_pagado, ...datosSocorro } = data;

    // Calcular fecha de vencimiento (ejemplo: 30 días después del inicio)
    const fechaInicio = new Date(fecha_inicio);
    const fechaVencimiento = new Date(fechaInicio);
    fechaVencimiento.setDate(fechaInicio.getDate() + 30); // 30 días por defecto

    // Iniciar transacción: crear socio primero
    const { data: socio, error: errorSocio } = await supabaseAdmin
      .from('socios')
      .insert({
        ...datosSocorro,
        id_usuario: req.user.id,
        codigo: `SOC-${Date.now()}`
      })
      .select()
      .single();

    if (errorSocio) throw errorSocio;

    // Crear membresía asociada
    const { data: membresia, error: errorMembresia } = await supabaseAdmin
      .from('membresias')
      .insert({
        id_socio: socio.id,
        id_tipo_membresia: tipo_membresia,
        fecha_inicio: fechaInicio.toISOString(),
        fecha_vencimiento: fechaVencimiento.toISOString(),
        precio_pagado: precio_pagado || 0,
        estado_pago: 'sin_pagar',
        estado: 'activo',
        id_usuario: req.user.id
      })
      .select()
      .single();

    if (errorMembresia) {
      // Si falla la membresía, eliminar el socio creado
      await supabaseAdmin.from('socios').delete().eq('id', socio.id);
      throw errorMembresia;
    }

    res.status(201).json({
      success: true,
      data: { socio: { ...socio, membresia } }
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
      .select(`
        *,
        membresias (
          id,
          fecha_inicio,
          fecha_vencimiento,
          precio_pagado,
          estado_pago,
          estado,
          tipos_membresia (
            id,
            nombre,
            precio,
            tipo
          )
        )
      `, { count: 'exact' })
      .eq('id_usuario', req.user.id);

    if (estado) query = query.eq('estado', estado);
    
    if (search) {
      query = query.or(
        `nombre.ilike.%${search}%,apellido_paterno.ilike.%${search}%,apellido_materno.ilike.%${search}%,email.ilike.%${search}%,codigo.ilike.%${search}%`
      );
    }

    const { data: socios, error, count } = await query
      .order('fecha_creacion', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    // Formatear datos para el frontend
    const sociosFormateados = socios.map(socio => {
      const membresiaActiva = socio.membresias && socio.membresias.length > 0 
        ? socio.membresias[0] 
        : null;

      return {
        ...socio,
        nombre_completo: `${socio.nombre} ${socio.apellido_paterno || ''} ${socio.apellido_materno || ''}`.trim(),
        tipo_membresia: membresiaActiva?.tipos_membresia?.nombre || '-',
        fecha_vencimiento: membresiaActiva?.fecha_vencimiento || null,
        estatus_pago: membresiaActiva?.estado_pago || 'sin_pagar',
        membresia_activa: membresiaActiva
      };
    });

    res.json({
      success: true,
      data: { socios: sociosFormateados, total: count }
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
      .select(`
        *,
        membresias (
          id,
          fecha_inicio,
          fecha_vencimiento,
          precio_pagado,
          estado_pago,
          estado,
          tipos_membresia (
            id,
            nombre,
            precio,
            tipo
          )
        )
      `)
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

    // Formatear datos
    const membresiaActiva = socio.membresias && socio.membresias.length > 0 
      ? socio.membresias[0] 
      : null;

    const socioFormateado = {
      ...socio,
      nombre_completo: `${socio.nombre} ${socio.apellido_paterno || ''} ${socio.apellido_materno || ''}`.trim(),
      tipo_membresia: membresiaActiva?.tipos_membresia?.nombre || '-',
      fecha_vencimiento: membresiaActiva?.fecha_vencimiento || null,
      estatus_pago: membresiaActiva?.estado_pago || 'sin_pagar',
      membresia_activa: membresiaActiva
    };

    res.json({
      success: true,
      data: { socio: socioFormateado }
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
    const updateSchema = createSocioSchema.partial().omit({ 
      tipo_membresia: true, 
      fecha_inicio: true,
      precio_pagado: true 
    });
    const data = updateSchema.parse(req.body);

    // Actualizar solo los datos del socio (no la membresía)
    const { data: socio, error } = await supabase
      .from('socios')
      .update(data)
      .eq('id', id)
      .eq('id_usuario', req.user.id)
      .select(`
        *,
        membresias (
          id,
          fecha_inicio,
          fecha_vencimiento,
          precio_pagado,
          estado_pago,
          estado,
          tipos_membresia (
            id,
            nombre,
            precio,
            tipo
          )
        )
      `)
      .single();

    if (error) throw error;

    // Formatear datos
    const membresiaActiva = socio.membresias && socio.membresias.length > 0 
      ? socio.membresias[0] 
      : null;

    const socioFormateado = {
      ...socio,
      nombre_completo: `${socio.nombre} ${socio.apellido_paterno || ''} ${socio.apellido_materno || ''}`.trim(),
      tipo_membresia: membresiaActiva?.tipos_membresia?.nombre || '-',
      fecha_vencimiento: membresiaActiva?.fecha_vencimiento || null,
      estatus_pago: membresiaActiva?.estado_pago || 'sin_pagar',
      membresia_activa: membresiaActiva
    };

    res.json({
      success: true,
      data: { socio: socioFormateado }
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

// Obtener tipos de membresía para el formulario
export const getTiposMembresia = async (req, res) => {
  try {
    const { data: tiposMembresia, error } = await supabaseAdmin
      .from('tipos_membresia')
      .select('id, nombre, precio, tipo, duracion_dias, duracion_meses')
      .eq('estado', 'activo')
      .order('nombre');

    if (error) throw error;

    // Si no hay tipos de membresía, crear algunos por defecto
    if (!tiposMembresia || tiposMembresia.length === 0) {
      const tiposDefault = [
        {
          nombre: 'Mensual',
          precio: 1400,
          tipo: 'mensual',
          duracion_meses: 1,
          duracion_dias: 30,
          estado: 'activo',
          descripcion: 'Membresía mensual estándar'
        },
        {
          nombre: 'Trimestral',
          precio: 3500,
          tipo: 'trimestral',
          duracion_meses: 3,
          duracion_dias: 90,
          estado: 'activo',
          descripcion: 'Membresía trimestral con descuento'
        },
        {
          nombre: 'Anual Premium',
          precio: 12000,
          tipo: 'anual',
          duracion_meses: 12,
          duracion_dias: 365,
          estado: 'activo',
          descripcion: 'Membresía anual premium con todos los beneficios'
        }
      ];

      const { data: nuevosTypes, error: errorCreate } = await supabaseAdmin
        .from('tipos_membresia')
        .insert(tiposDefault)
        .select('id, nombre, precio, tipo, duracion_dias, duracion_meses');

      if (errorCreate) {
        console.error('Error creando tipos por defecto:', errorCreate);
        // Retornar tipos hardcodeados si falla la BD
        res.json({
          success: true,
          data: { 
            tiposMembresia: [
              { id: 'mensual', nombre: 'Mensual', precio: 1400 },
              { id: 'trimestral', nombre: 'Trimestral', precio: 3500 },
              { id: 'anual', nombre: 'Anual Premium', precio: 12000 }
            ]
          }
        });
        return;
      }

      res.json({
        success: true,
        data: { tiposMembresia: nuevosTypes }
      });
      return;
    }

    res.json({
      success: true,
      data: { tiposMembresia }
    });
  } catch (error) {
    console.error('[Get Tipos Membresia Error]', error.message);
    // En caso de error, retornar tipos por defecto
    res.json({
      success: true,
      data: { 
        tiposMembresia: [
          { id: 'mensual', nombre: 'Mensual', precio: 1400 },
          { id: 'trimestral', nombre: 'Trimestral', precio: 3500 },
          { id: 'anual', nombre: 'Anual Premium', precio: 12000 }
        ]
      }
    });
  }
};