import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  serverTimestamp,
  or,
  runTransaction
} from 'firebase/firestore';
import { db } from '../config/firebase-config.js';
import { z } from 'zod';
import { updateProductStock } from './productsController.js';

// Esquema para item de producto en una venta
const saleItemSchema = z.object({
  producto_id: z.string().min(1, 'ID de producto requerido'),
  codigo_producto: z.string().min(1, 'Código de producto requerido'),
  nombre_producto: z.string().min(1, 'Nombre de producto requerido'),
  cantidad: z.number().int().positive('La cantidad debe ser positiva'),
  precio_unitario: z.number().positive('El precio unitario debe ser positivo'),
  subtotal: z.number().positive('El subtotal debe ser positivo')
});

// Esquema para crear una venta
const createSaleSchema = z.object({
  observaciones: z.string().optional().default(''),
  productos: z.array(saleItemSchema).min(1, 'Debe incluir al menos un producto'),
  // total se calcula automáticamente
  // fecha_creacion se asigna automáticamente
  // status_venta se asigna como 'exitosa' por defecto
});

// Esquema para actualizar una venta
const updateSaleSchema = z.object({
  observaciones: z.string().optional(),
  status_venta: z.enum(['exitosa', 'cancelada']).optional()
});

// Esquema para búsqueda de ventas
const searchSalesSchema = z.object({
  search: z.string().optional(),
  fecha_desde: z.string().optional(),
  fecha_hasta: z.string().optional()
});

// Esquema para filtrar ventas
const filterSalesSchema = z.object({
  status: z.enum(['exitosa', 'cancelada']).optional(),
  total_min: z.number().positive().optional(),
  total_max: z.number().positive().optional()
});

// Helper function para generar UUID para ventas
const generateSaleId = () => {
  return 'sale_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Helper function para calcular total de la venta
const calculateSaleTotal = (productos) => {
  return productos.reduce((total, item) => total + item.subtotal, 0);
};

// 1. POST - Crear nueva venta
export const createSale = async (req, res) => {
  try {
    console.log('[Create Sale] Request body:', req.body);
    
    const data = createSaleSchema.parse(req.body);

    // Verificar que todos los productos existen y tienen stock suficiente
    const productosValidados = [];
    const ventasRef = collection(db, 'ventas');

    for (const item of data.productos) {
      const productDoc = await getDoc(doc(db, 'productos', item.producto_id));
      
      if (!productDoc.exists()) {
        return res.status(400).json({
          success: false,
          error: `Producto con ID ${item.producto_id} no encontrado`,
          code: 'PRODUCT_NOT_FOUND'
        });
      }

      const productData = productDoc.data();
      
      // Verificar que el producto pertenece al usuario
      if (productData.id_usuario !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: `No tienes permisos para vender el producto ${item.codigo_producto}`,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      // Verificar stock disponible
      if (productData.cantidad_stock < item.cantidad) {
        return res.status(400).json({
          success: false,
          error: `Stock insuficiente para ${item.nombre_producto}. Disponible: ${productData.cantidad_stock}, Solicitado: ${item.cantidad}`,
          code: 'INSUFFICIENT_STOCK'
        });
      }

      productosValidados.push({
        ...item,
        stock_actual: productData.cantidad_stock
      });
    }

    // Calcular total de la venta
    const total = calculateSaleTotal(data.productos);

    // Crear datos de la venta
    const saleData = {
      uuid_venta: generateSaleId(),
      observaciones: data.observaciones,
      productos: data.productos,
      total: total,
      fecha_creacion: serverTimestamp(),
      status_venta: 'exitosa',
      id_usuario: req.user.id
    };

    // Crear la venta en Firestore
    const docRef = await addDoc(ventasRef, saleData);

    // Actualizar stock de todos los productos
    const stockUpdates = [];
    for (const item of data.productos) {
      try {
        const stockUpdate = await updateProductStock(item.producto_id, item.cantidad);
        stockUpdates.push(stockUpdate);
      } catch (error) {
        console.error(`Error actualizando stock para producto ${item.producto_id}:`, error);
        // En caso de error, podrías decidir revertir la venta o continuar con logging
      }
    }

    console.log('[Create Sale] Venta creada exitosamente:', docRef.id);
    console.log('[Create Sale] Stock actualizado para productos:', stockUpdates);

    res.status(201).json({
      success: true,
      data: {
        venta: {
          id: docRef.id,
          ...saleData,
          fecha_creacion: new Date().toISOString()
        },
        stock_updates: stockUpdates
      },
      message: 'Venta realizada exitosamente'
    });

  } catch (error) {
    console.error('[Create Sale Error]', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Datos de entrada inválidos',
        details: error.errors,
        code: 'VALIDATION_ERROR'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Error al crear venta',
      code: 'CREATE_SALE_ERROR'
    });
  }
};

// 2. PUT - Editar venta (solo observaciones y status)
export const updateSale = async (req, res) => {
  try {
    const { saleId } = req.params;
    console.log('[Update Sale] Updating sale:', saleId);
    
    const data = updateSaleSchema.parse(req.body);

    // Verificar que la venta existe
    const saleDoc = await getDoc(doc(db, 'ventas', saleId));
    if (!saleDoc.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Venta no encontrada',
        code: 'SALE_NOT_FOUND'
      });
    }

    const saleData = saleDoc.data();
    
    // Verificar permisos
    if (saleData.id_usuario !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para editar esta venta',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Preparar datos de actualización
    const updateData = {
      ...data,
      fecha_actualizacion: serverTimestamp()
    };

    await updateDoc(doc(db, 'ventas', saleId), updateData);

    // Obtener datos actualizados
    const updatedDoc = await getDoc(doc(db, 'ventas', saleId));
    const updatedData = updatedDoc.data();

    console.log('[Update Sale] Venta actualizada exitosamente:', saleId);

    res.json({
      success: true,
      data: {
        venta: {
          id: updatedDoc.id,
          ...updatedData
        }
      },
      message: 'Venta actualizada correctamente'
    });

  } catch (error) {
    console.error('[Update Sale Error]', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Datos de entrada inválidos',
        details: error.errors,
        code: 'VALIDATION_ERROR'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error al actualizar venta',
      code: 'UPDATE_SALE_ERROR'
    });
  }
};

// 3. DELETE - Eliminar venta (no recomendado, mejor marcar como cancelada)
export const deleteSale = async (req, res) => {
  try {
    const { saleId } = req.params;
    console.log('[Delete Sale] Deleting sale:', saleId);

    // Verificar que la venta existe
    const saleDoc = await getDoc(doc(db, 'ventas', saleId));
    if (!saleDoc.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Venta no encontrada',
        code: 'SALE_NOT_FOUND'
      });
    }

    const saleData = saleDoc.data();
    
    // Verificar permisos
    if (saleData.id_usuario !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para eliminar esta venta',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // En lugar de eliminar, marcar como cancelada
    await updateDoc(doc(db, 'ventas', saleId), {
      status_venta: 'cancelada',
      fecha_cancelacion: serverTimestamp(),
      fecha_actualizacion: serverTimestamp()
    });

    console.log('[Delete Sale] Venta marcada como cancelada:', saleId);

    res.json({
      success: true,
      data: {
        cancelled_sale: {
          id: saleId,
          uuid_venta: saleData.uuid_venta,
          total: saleData.total
        }
      },
      message: 'Venta cancelada correctamente'
    });

  } catch (error) {
    console.error('[Delete Sale Error]', error);
    res.status(500).json({
      success: false,
      error: 'Error al cancelar venta',
      code: 'DELETE_SALE_ERROR'
    });
  }
};

// 4. GET - Obtener venta individual por ID
export const getSaleById = async (req, res) => {
  try {
    const { saleId } = req.params;
    console.log('[Get Sale By ID] Obteniendo venta:', saleId);

    // Verificar que la venta existe
    const saleDoc = await getDoc(doc(db, 'ventas', saleId));
    
    if (!saleDoc.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Venta no encontrada',
        code: 'SALE_NOT_FOUND'
      });
    }

    const saleData = saleDoc.data();
    
    // Verificar permisos
    if (saleData.id_usuario !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para ver esta venta',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    console.log('[Get Sale By ID] Venta encontrada exitosamente:', saleId);

    res.json({
      success: true,
      data: {
        venta: {
          id: saleDoc.id,
          ...saleData
        }
      },
      message: 'Venta obtenida correctamente'
    });

  } catch (error) {
    console.error('[Get Sale By ID Error]', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener la venta',
      code: 'GET_SALE_BY_ID_ERROR'
    });
  }
};

// 5. GET - Obtener todas las ventas con paginación
export const getSales = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10,
      sortBy = 'fecha_creacion',
      sortOrder = 'desc'
    } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    console.log('[Get Sales] Parámetros:', { page: pageNumber, limit: limitNumber, sortBy, sortOrder });

    // Construir query
    let salesQuery = collection(db, 'ventas');
    
    // Filtrar por usuario actual
    salesQuery = query(salesQuery, where('id_usuario', '==', req.user.id));
    
    // Ejecutar query
    const querySnapshot = await getDocs(salesQuery);
    let ventas = [];
    
    querySnapshot.forEach((doc) => {
      const saleData = doc.data();
      ventas.push({
        id: doc.id,
        ...saleData
      });
    });

    console.log(`[Get Sales] Ventas obtenidas: ${ventas.length}`);

    // Paginación local
    const total = ventas.length;
    const totalPages = Math.ceil(total / limitNumber);
    const offset = (pageNumber - 1) * limitNumber;
    const paginatedSales = ventas.slice(offset, offset + limitNumber);

    res.json({
      success: true,
      data: {
        ventas: paginatedSales,
        pagination: {
          current_page: pageNumber,
          per_page: limitNumber,
          total: total,
          total_pages: totalPages,
          has_next_page: pageNumber < totalPages,
          has_prev_page: pageNumber > 1
        }
      },
      message: `Se encontraron ${total} ventas`
    });

  } catch (error) {
    console.error('[Get Sales Error]', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener ventas',
      code: 'GET_SALES_ERROR'
    });
  }
};

// 6. GET - Buscar ventas
export const searchSales = async (req, res) => {
  try {
    const { search, fecha_desde, fecha_hasta } = req.query;
    
    console.log('[Search Sales] Parámetros:', { search, fecha_desde, fecha_hasta });

    const salesRef = collection(db, 'ventas');
    let salesQuery = query(salesRef, where('id_usuario', '==', req.user.id));
    
    const querySnapshot = await getDocs(salesQuery);
    let ventas = [];
    
    querySnapshot.forEach((doc) => {
      const saleData = doc.data();
      ventas.push({
        id: doc.id,
        ...saleData
      });
    });

    console.log(`[Search Sales] Ventas obtenidas de base: ${ventas.length}`);

    // Función helper para normalizar texto
    const normalizeText = (text) => {
      if (!text) return '';
      return text.normalize('NFD')
                 .replace(/[\u0300-\u036f]/g, '')
                 .toLowerCase()
                 .trim();
    };

    // Búsqueda local
    let filteredSales = ventas;

    if (search) {
      const searchTerm = normalizeText(search);
      console.log(`[Search Sales] Buscando normalizado: "${searchTerm}"`);
      filteredSales = ventas.filter(sale => {
        const uuid = normalizeText(sale.uuid_venta);
        const observaciones = normalizeText(sale.observaciones);
        const productos = sale.productos?.map(p => normalizeText(p.nombre_producto)).join(' ') || '';
        
        return uuid.includes(searchTerm) || 
               observaciones.includes(searchTerm) || 
               productos.includes(searchTerm);
      });
    }

    // Filtrar por fechas
    if (fecha_desde || fecha_hasta) {
      filteredSales = filteredSales.filter(sale => {
        const fechaCreacion = sale.fecha_creacion?.toDate?.() || new Date(sale.fecha_creacion);
        if (fecha_desde && fechaCreacion < new Date(fecha_desde)) return false;
        if (fecha_hasta && fechaCreacion > new Date(fecha_hasta)) return false;
        return true;
      });
    }

    console.log(`[Search Sales] Ventas encontradas: ${filteredSales.length}`);

    res.json({
      success: true,
      data: {
        ventas: filteredSales,
        total: filteredSales.length
      },
      message: `Se encontraron ${filteredSales.length} ventas`
    });

  } catch (error) {
    console.error('[Search Sales Error]', error);
    res.status(500).json({
      success: false,
      error: 'Error al buscar ventas',
      code: 'SEARCH_SALES_ERROR'
    });
  }
};

// 7. GET - Filtrar ventas por status y total
export const filterSales = async (req, res) => {
  try {
    const { status, total_min, total_max } = req.query;
    
    console.log('[Filter Sales] Filtros:', { status, total_min, total_max });

    const salesRef = collection(db, 'ventas');
    let salesQuery = query(salesRef, where('id_usuario', '==', req.user.id));
    
    const querySnapshot = await getDocs(salesQuery);
    let ventas = [];
    
    querySnapshot.forEach((doc) => {
      const saleData = doc.data();
      ventas.push({
        id: doc.id,
        ...saleData
      });
    });

    // Aplicar filtros localmente
    let filteredSales = ventas;

    if (status) {
      filteredSales = filteredSales.filter(sale => 
        sale.status_venta === status
      );
    }

    if (total_min) {
      const minTotal = parseFloat(total_min);
      filteredSales = filteredSales.filter(sale => 
        sale.total >= minTotal
      );
    }

    if (total_max) {
      const maxTotal = parseFloat(total_max);
      filteredSales = filteredSales.filter(sale => 
        sale.total <= maxTotal
      );
    }

    console.log(`[Filter Sales] Ventas filtradas: ${filteredSales.length}`);

    res.json({
      success: true,
      data: {
        ventas: filteredSales,
        total: filteredSales.length,
        filters: {
          status,
          total_min,
          total_max
        }
      },
      message: `Se encontraron ${filteredSales.length} ventas`
    });

  } catch (error) {
    console.error('[Filter Sales Error]', error);
    res.status(500).json({
      success: false,
      error: 'Error al filtrar ventas',
      code: 'FILTER_SALES_ERROR'
    });
  }
};