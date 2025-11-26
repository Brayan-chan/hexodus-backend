import { db } from '../config/firebase-config.js';
import { collection, addDoc, getDocs, doc, getDoc, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { z } from 'zod';

// Esquemas de validación
const reportRequestSchema = z.object({
  tipo_reporte: z.enum(['inventario', 'ventas', 'membresias', 'usuarios', 'socios']),
  fecha_inicio: z.string().optional(),
  fecha_fin: z.string().optional(),
  filtros: z.object({}).optional()
});

// Función auxiliar para guardar el reporte en la colección
const guardarReporte = async (userId, tipoReporte, datosReporte) => {
  const reporteDoc = {
    user_id: userId,
    tipo_reporte: tipoReporte,
    titulo: datosReporte.titulo,
    fecha_generacion: Timestamp.now(),
    fecha_inicio: datosReporte.fecha_inicio ? new Date(datosReporte.fecha_inicio) : null,
    fecha_fin: datosReporte.fecha_fin ? new Date(datosReporte.fecha_fin) : null,
    estadisticas: datosReporte.estadisticas || {},
    total_registros: datosReporte.total_registros || 0,
    datos_resumen: datosReporte.datos_resumen || null,
    status: 'generado'
  };

  const reporteRef = await addDoc(collection(db, 'reportes'), reporteDoc);
  return { id: reporteRef.id, ...reporteDoc, fecha_generacion: new Date().toISOString() };
};

// 1. Reporte de Inventario
export const getInventoryReport = async (req, res) => {
  try {
    const userId = req.user?.uid || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
        code: 'UNAUTHORIZED'
      });
    }

    // Obtener productos del inventario de forma simple
    let productos = [];
    try {
      const productosSnapshot = await getDocs(collection(db, 'productos'));
      productos = productosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fecha_creacion: doc.data().fecha_creacion?.toDate?.()?.toISOString() || null
      }));
    } catch (productosError) {
      console.warn('Error obteniendo productos:', productosError.message);
      productos = [];
    }

    // Calcular estadísticas básicas de forma segura
    const totalProductos = productos.length;
    const stockTotal = productos.reduce((sum, p) => {
      const stock = p.cantidad_stock || p.stock || 0;
      return sum + (isNaN(stock) ? 0 : Number(stock));
    }, 0);

    const valorTotalInventario = productos.reduce((sum, p) => {
      const stock = p.cantidad_stock || p.stock || 0;
      const precio = p.precio || 0;
      const stockNum = isNaN(stock) ? 0 : Number(stock);
      const precioNum = isNaN(precio) ? 0 : Number(precio);
      return sum + (stockNum * precioNum);
    }, 0);

    const productosAgotados = productos.filter(p => {
      const stock = p.cantidad_stock || p.stock || 0;
      return Number(stock) === 0;
    }).length;

    const productosBajoStock = productos.filter(p => {
      const stock = p.cantidad_stock || p.stock || 0;
      const stockMin = p.stock_minimo || 5;
      const stockNum = Number(stock);
      const stockMinNum = Number(stockMin);
      return stockNum > 0 && stockNum <= stockMinNum;
    }).length;

    const reportData = {
      titulo: 'Reporte de Inventario',
      fecha_generacion: new Date().toISOString(),
      total_registros: totalProductos,
      estadisticas: {
        total_productos: totalProductos,
        stock_total: stockTotal,
        valor_total_inventario: Math.round(valorTotalInventario * 100) / 100,
        productos_agotados: productosAgotados,
        productos_bajo_stock: productosBajoStock
      },
      datos_resumen: {
        productos_por_status: productos.reduce((acc, p) => {
          const status = p.status_producto || 'Sin estado';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {}),
        alertas_criticas: {
          productos_sin_stock: productosAgotados,
          productos_stock_bajo: productosBajoStock
        }
      },
      datos: productos
    };

    const reporteGuardado = await guardarReporte(userId, 'inventario', reportData);

    res.json({
      success: true,
      data: { 
        report: reportData,
        reporte_id: reporteGuardado.id
      }
    });
  } catch (error) {
    console.error('[Get Inventory Report Error]', error.message, error.stack);
    res.status(500).json({
      success: false,
      error: 'Error al generar reporte de inventario',
      code: 'INVENTORY_REPORT_ERROR',
      details: error.message
    });
  }
};

// 2. Reporte de Ventas
export const getSalesReport = async (req, res) => {
  try {
    const userId = req.user?.uid || req.user?.id;
    const { fecha_inicio, fecha_fin } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
        code: 'UNAUTHORIZED'
      });
    }

    // Obtener ventas de forma simple
    let ventas = [];
    try {
      const ventasSnapshot = await getDocs(collection(db, 'ventas'));
      ventas = ventasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fecha_creacion: doc.data().fecha_creacion?.toDate?.()?.toISOString() || null
      }));
    } catch (ventasError) {
      console.warn('Error obteniendo ventas:', ventasError.message);
      ventas = [];
    }

    // Filtrar por fechas si se especifican
    if (fecha_inicio && fecha_fin) {
      try {
        const fechaInicioDate = new Date(fecha_inicio);
        const fechaFinDate = new Date(fecha_fin);
        
        ventas = ventas.filter(venta => {
          if (!venta.fecha_creacion) return false;
          const fechaVenta = new Date(venta.fecha_creacion);
          return fechaVenta >= fechaInicioDate && fechaVenta <= fechaFinDate;
        });
      } catch (filterError) {
        console.warn('Error filtrando por fechas:', filterError.message);
      }
    }

    // Calcular estadísticas básicas
    const totalVentas = ventas.length;
    const montoTotal = ventas.reduce((sum, v) => {
      const monto = v.total || v.monto_total || 0;
      return sum + Number(monto);
    }, 0);

    const reportData = {
      titulo: 'Reporte de Ventas',
      fecha_generacion: new Date().toISOString(),
      fecha_inicio,
      fecha_fin,
      total_registros: totalVentas,
      estadisticas: {
        total_ventas: totalVentas,
        monto_total: Math.round(montoTotal * 100) / 100
      },
      datos_resumen: {
        ventas_procesadas: totalVentas
      },
      datos: ventas
    };

    const reporteGuardado = await guardarReporte(userId, 'ventas', reportData);

    res.json({
      success: true,
      data: { 
        report: reportData,
        reporte_id: reporteGuardado.id
      }
    });
  } catch (error) {
    console.error('[Get Sales Report Error]', error.message, error.stack);
    res.status(500).json({
      success: false,
      error: 'Error al generar reporte de ventas',
      code: 'SALES_REPORT_ERROR',
      details: error.message
    });
  }
};

// 3. Reporte de Membresías
export const getMembershipsReport = async (req, res) => {
  try {
    const userId = req.user?.uid || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
        code: 'UNAUTHORIZED'
      });
    }

    // Obtener membresías de socios con manejo de errores
    let membresiasData = [];
    try {
      const membresiasSnapshot = await getDocs(collection(db, 'membresia_socio'));
      membresiasData = membresiasSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          fecha_creacion: data.fecha_creacion?.toDate ? data.fecha_creacion.toDate().toISOString() : (data.fecha_creacion || null),
          fecha_inicio: data.fecha_inicio?.toDate ? data.fecha_inicio.toDate().toISOString() : (data.fecha_inicio || null),
          fecha_fin: data.fecha_fin?.toDate ? data.fecha_fin.toDate().toISOString() : (data.fecha_fin || null)
        };
      });
    } catch (membresiaError) {
      console.warn('Error obteniendo membresías:', membresiaError.message);
      membresiasData = [];
    }

    // Obtener información de socios con manejo de errores
    let socios = {};
    try {
      const sociosSnapshot = await getDocs(collection(db, 'socios'));
      sociosSnapshot.docs.forEach(doc => {
        socios[doc.id] = doc.data();
      });
    } catch (sociosError) {
      console.warn('Error obteniendo socios:', sociosError.message);
      socios = {};
    }

    // Obtener tipos de membresía con manejo de errores
    let tiposMembresias = {};
    try {
      const tiposMembresiasSnapshot = await getDocs(collection(db, 'membresias'));
      tiposMembresiasSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.uuid_membresia) {
          tiposMembresias[data.uuid_membresia] = data;
        }
      });
    } catch (membresiasTiposError) {
      console.warn('Error obteniendo tipos de membresías:', membresiasTiposError.message);
      tiposMembresias = {};
    }

    // Enriquecer datos de membresías de forma segura
    const membresiasConDetalles = membresiasData.map(membresia => {
      const socioInfo = socios[membresia.uuid_socio] || null;
      const membresiaInfo = tiposMembresias[membresia.uuid_membresia] || null;
      
      return {
        ...membresia,
        socio_info: socioInfo,
        membresia_info: membresiaInfo
      };
    });

    // Calcular estadísticas de forma segura
    const totalMembresias = membresiasConDetalles.length;
    const membresiasPagadas = membresiasConDetalles.filter(m => m.status_membresia_socio === 'pagado').length;
    const membresiasNoPagadas = membresiasConDetalles.filter(m => m.status_membresia_socio === 'no_pagado').length;
    
    // Calcular ingresos por membresías pagadas
    const ingresosPorPagos = membresiasConDetalles
      .filter(m => m.status_membresia_socio === 'pagado')
      .reduce((sum, m) => {
        const precio = m.membresia_info?.precio;
        if (precio && !isNaN(precio)) {
          return sum + parseFloat(precio);
        }
        return sum;
      }, 0);

    // Calcular tipos de membresía más populares de forma segura
    const tiposPopulares = membresiasConDetalles.reduce((acc, m) => {
      const tipo = m.membresia_info?.nombre_membresia || 'Sin definir';
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});

    const reportData = {
      titulo: 'Reporte de Membresías',
      fecha_generacion: new Date().toISOString(),
      total_registros: totalMembresias,
      estadisticas: {
        total_membresias: totalMembresias,
        membresias_pagadas: membresiasPagadas,
        membresias_no_pagadas: membresiasNoPagadas,
        tasa_pago: totalMembresias > 0 ? Math.round((membresiasPagadas / totalMembresias) * 100 * 100) / 100 : 0,
        ingresos_por_membresias: Math.round(ingresosPorPagos * 100) / 100
      },
      datos_resumen: {
        tipos_membresia_mas_populares: Object.entries(tiposPopulares)
          .sort((a, b) => b[1] - a[1])
          .map(([tipo, cantidad]) => ({ tipo, cantidad })),
        membresias_por_estado: {
          pagadas: membresiasPagadas,
          no_pagadas: membresiasNoPagadas
        },
        distribucion_por_mes: membresiasConDetalles.reduce((acc, m) => {
          if (m.fecha_creacion) {
            const mes = m.fecha_creacion.substring(0, 7); // YYYY-MM
            acc[mes] = (acc[mes] || 0) + 1;
          }
          return acc;
        }, {})
      },
      datos: membresiasConDetalles
    };

    const reporteGuardado = await guardarReporte(userId, 'membresias', reportData);

    res.json({
      success: true,
      data: { 
        report: reportData,
        reporte_id: reporteGuardado.id
      }
    });
  } catch (error) {
    console.error('[Get Memberships Report Error]', error.message, error.stack);
    res.status(500).json({
      success: false,
      error: 'Error al generar reporte de membresías',
      code: 'MEMBERSHIPS_REPORT_ERROR',
      details: error.message
    });
  }
};

// 4. Reporte de Usuarios
export const getUsersReport = async (req, res) => {
  try {
    const userId = req.user?.uid || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
        code: 'UNAUTHORIZED'
      });
    }

    // Obtener usuarios (este reporte podría ser solo para el usuario actual o para administradores)
    const usuariosQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc')
    );

    const usuariosSnapshot = await getDocs(usuariosQuery);
    const usuarios = usuariosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      lastLogin: doc.data().lastLogin?.toDate?.()?.toISOString() || null
    }));

    // Calcular estadísticas avanzadas
    const totalUsuarios = usuarios.length;
    const usuariosActivos = usuarios.filter(u => u.status === 'activo' || u.status === 'active').length;
    const usuariosInactivos = totalUsuarios - usuariosActivos;

    // Usuarios registrados en los últimos 30 días
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 30);
    const usuariosRecientes = usuarios.filter(u => {
      if (!u.createdAt) return false;
      return new Date(u.createdAt) >= fechaLimite;
    }).length;

    // Análisis por roles
    const usuariosPorRol = usuarios.reduce((acc, u) => {
      const rol = u.rol || 'Sin rol';
      acc[rol] = (acc[rol] || 0) + 1;
      return acc;
    }, {});

    // Análisis de actividad
    const usuariosConUltimoAcceso = usuarios.filter(u => u.ultimo_acceso || u.lastLogin).length;
    const usuariosSinActividad = totalUsuarios - usuariosConUltimoAcceso;

    const reportData = {
      titulo: 'Reporte de Usuarios',
      fecha_generacion: new Date().toISOString(),
      total_registros: totalUsuarios,
      estadisticas: {
        total_usuarios: totalUsuarios,
        usuarios_activos: usuariosActivos,
        usuarios_inactivos: usuariosInactivos,
        usuarios_registrados_30_dias: usuariosRecientes,
        tasa_usuarios_activos: totalUsuarios > 0 ? Math.round((usuariosActivos / totalUsuarios) * 100 * 100) / 100 : 0,
        usuarios_con_actividad: usuariosConUltimoAcceso,
        usuarios_sin_actividad: usuariosSinActividad
      },
      datos_resumen: {
        usuarios_por_estado: {
          activos: usuariosActivos,
          inactivos: usuariosInactivos
        },
        usuarios_por_rol: usuariosPorRol,
        registros_por_mes: usuarios.reduce((acc, u) => {
          if (u.createdAt) {
            const mes = u.createdAt.substring(0, 7); // YYYY-MM
            acc[mes] = (acc[mes] || 0) + 1;
          }
          return acc;
        }, {}),
        actividad_reciente: {
          con_acceso_reciente: usuariosConUltimoAcceso,
          sin_actividad: usuariosSinActividad,
          registrados_ultimo_mes: usuariosRecientes
        }
      },
      datos: usuarios
    };

    const reporteGuardado = await guardarReporte(userId, 'usuarios', reportData);

    res.json({
      success: true,
      data: { 
        report: reportData,
        reporte_id: reporteGuardado.id
      }
    });
  } catch (error) {
    console.error('[Get Users Report Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al generar reporte de usuarios',
      code: 'USERS_REPORT_ERROR'
    });
  }
};

// 5. Reporte de Socios
export const getSociosReport = async (req, res) => {
  try {
    const userId = req.user?.uid || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
        code: 'UNAUTHORIZED'
      });
    }

    // Obtener socios
    const sociosQuery = query(
      collection(db, 'socios'),
      orderBy('fecha_creacion', 'desc')
    );

    const sociosSnapshot = await getDocs(sociosQuery);
    const sociosData = sociosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      fecha_creacion: doc.data().fecha_creacion?.toDate?.()?.toISOString() || null
    }));

    // Obtener membresías de socios para análisis completo
    const membresiasQuery = query(collection(db, 'membresia_socio'));
    const membresiasSnapshot = await getDocs(membresiasQuery);
    const membresiasData = membresiasSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Enriquecer socios con información de membresías
    const sociosConMembresias = sociosData.map(socio => {
      const membresias = membresiasData.filter(m => m.uuid_socio === socio.id);
      const membresiaActiva = membresias.find(m => socio.uuid_membresia_socio === m.id);
      
      return {
        ...socio,
        total_membresias: membresias.length,
        membresia_activa: membresiaActiva || null,
        historial_membresias: membresias
      };
    });

    // Calcular estadísticas
    const totalSocios = sociosConMembresias.length;
    const sociosActivos = sociosConMembresias.filter(s => s.status === 'activo').length;
    const sociosInactivos = sociosConMembresias.filter(s => s.status === 'inactivo').length;
    const sociosConMembresiaActiva = sociosConMembresias.filter(s => s.membresia_activa).length;

    const reportData = {
      titulo: 'Reporte de Socios y sus Membresías',
      fecha_generacion: new Date().toISOString(),
      total_registros: totalSocios,
      estadisticas: {
        total_socios: totalSocios,
        socios_activos: sociosActivos,
        socios_inactivos: sociosInactivos,
        socios_con_membresia_activa: sociosConMembresiaActiva,
        tasa_socios_con_membresia: totalSocios > 0 ? (sociosConMembresiaActiva / totalSocios) * 100 : 0
      },
      datos_resumen: {
        socios_por_estado: {
          activos: sociosActivos,
          inactivos: sociosInactivos
        },
        distribucion_membresias: {
          con_membresia: sociosConMembresiaActiva,
          sin_membresia: totalSocios - sociosConMembresiaActiva
        }
      },
      datos: sociosConMembresias
    };

    const reporteGuardado = await guardarReporte(userId, 'socios', reportData);

    res.json({
      success: true,
      data: { 
        report: reportData,
        reporte_id: reporteGuardado.id
      }
    });
  } catch (error) {
    console.error('[Get Socios Report Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al generar reporte de socios',
      code: 'SOCIOS_REPORT_ERROR'
    });
  }
};

// 6. Obtener historial de reportes generados
export const getReportsHistory = async (req, res) => {
  try {
    const userId = req.user?.uid || req.user?.id;
    const { tipo_reporte, limit: limitParam } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
        code: 'UNAUTHORIZED'
      });
    }

    // Obtener reportes de forma simple
    let reportes = [];
    try {
      const reportesSnapshot = await getDocs(collection(db, 'reportes'));
      reportes = reportesSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          fecha_generacion: doc.data().fecha_generacion?.toDate?.()?.toISOString() || null,
          fecha_inicio: doc.data().fecha_inicio?.toDate?.()?.toISOString() || doc.data().fecha_inicio || null,
          fecha_fin: doc.data().fecha_fin?.toDate?.()?.toISOString() || doc.data().fecha_fin || null
        }))
        .filter(r => r.user_id === userId); // Filtrar por usuario

      // Ordenar por fecha de generación (más recientes primero)
      reportes.sort((a, b) => {
        const fechaA = new Date(a.fecha_generacion || 0);
        const fechaB = new Date(b.fecha_generacion || 0);
        return fechaB - fechaA;
      });
      
      // Filtrar por tipo si se especifica
      if (tipo_reporte) {
        reportes = reportes.filter(r => r.tipo_reporte === tipo_reporte);
      }

      // Limitar resultados
      if (limitParam) {
        const limit = parseInt(limitParam);
        if (!isNaN(limit) && limit > 0) {
          reportes = reportes.slice(0, limit);
        }
      }
    } catch (error) {
      console.warn('Error obteniendo reportes:', error.message);
      reportes = [];
    }

    res.json({
      success: true,
      data: { 
        reportes,
        total: reportes.length
      }
    });
  } catch (error) {
    console.error('[Get Reports History Error]', error.message, error.stack);
    res.status(500).json({
      success: false,
      error: 'Error al obtener historial de reportes',
      code: 'REPORTS_HISTORY_ERROR',
      details: error.message
    });
  }
};

// 7. Obtener reporte específico por ID
export const getReportById = async (req, res) => {
  try {
    const userId = req.user?.uid || req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
        code: 'UNAUTHORIZED'
      });
    }

    const reporteDoc = await getDoc(doc(db, 'reportes', id));

    if (!reporteDoc.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Reporte no encontrado',
        code: 'REPORT_NOT_FOUND'
      });
    }

    const reporteData = reporteDoc.data();

    // Verificar que el reporte pertenece al usuario
    if (reporteData.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para ver este reporte',
        code: 'FORBIDDEN'
      });
    }

    const reporte = {
      id: reporteDoc.id,
      ...reporteData,
      fecha_generacion: reporteData.fecha_generacion?.toDate?.()?.toISOString() || null,
      fecha_inicio: reporteData.fecha_inicio?.toDate?.()?.toISOString() || null,
      fecha_fin: reporteData.fecha_fin?.toDate?.()?.toISOString() || null
    };

    res.json({
      success: true,
      data: { reporte }
    });
  } catch (error) {
    console.error('[Get Report By ID Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al obtener reporte',
      code: 'GET_REPORT_ERROR'
    });
  }
};