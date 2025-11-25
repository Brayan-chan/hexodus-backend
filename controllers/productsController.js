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
  or
} from 'firebase/firestore';
import { db } from '../config/firebase-config.js';
import { z } from 'zod';

// Esquemas de validación basados en la estructura de la imagen
const createProductSchema = z.object({
  codigo_producto: z.string().min(1, 'Código de producto requerido'),
  nombre_producto: z.string().min(2, 'Nombre de producto requerido'),
  descripcion: z.string().optional().default(''),
  costo: z.number().positive('El costo debe ser positivo'),
  precio: z.number().positive('El precio debe ser positivo'),
  cantidad_stock: z.number().int().min(0, 'La cantidad en stock debe ser positiva o cero').default(0),
  stock_minimo: z.number().int().min(0, 'El stock mínimo debe ser positivo o cero').default(5)
  // status_producto se calcula automáticamente basado en cantidad_stock
});

const updateProductSchema = createProductSchema.partial();

const searchProductSchema = z.object({
  search: z.string().optional(),
  nombre: z.string().optional(),
  codigo: z.string().optional()
});

const filterProductSchema = z.object({
  status: z.enum(['en stock', 'agotado']).optional(),
  precio_min: z.number().positive().optional(),
  precio_max: z.number().positive().optional(),
  stock_min: z.number().int().min(0).optional(),
  stock_max: z.number().int().min(0).optional()
});

// Helper function para calcular status basado en stock
const calculateProductStatus = (cantidadStock, stockMinimo = 5) => {
  if (cantidadStock <= 0) {
    return 'agotado';
  } else if (cantidadStock <= stockMinimo) {
    return 'stock bajo';
  } else {
    return 'en stock';
  }
};

// Helper function para generar UUID simple
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 1. POST - Crear producto
export const createProduct = async (req, res) => {
  try {
    console.log('[Create Product] Request body:', req.body);
    
    const data = createProductSchema.parse(req.body);

    // Verificar si el código de producto ya existe
    const productosRef = collection(db, 'productos');
    const q = query(productosRef, where('codigo_producto', '==', data.codigo_producto));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return res.status(400).json({
        success: false,
        error: 'El código de producto ya existe',
        code: 'PRODUCT_CODE_EXISTS'
      });
    }

    // Crear el producto
    // Calcular status automáticamente basado en stock
    const statusProducto = calculateProductStatus(data.cantidad_stock, data.stock_minimo);

    const productData = {
      uuid_producto: generateId(),
      codigo_producto: data.codigo_producto,
      nombre_producto: data.nombre_producto,
      descripcion: data.descripcion,
      costo: data.costo,
      precio: data.precio,
      cantidad_stock: data.cantidad_stock,
      stock_minimo: data.stock_minimo,
      status_producto: statusProducto,
      fecha_creacion: serverTimestamp(),
      id_usuario: req.user.id
    };

    const docRef = await addDoc(productosRef, productData);

    console.log('[Create Product] Producto creado exitosamente:', docRef.id);

    res.status(201).json({
      success: true,
      data: {
        producto: {
          id: docRef.id,
          ...productData,
          fecha_creacion: new Date().toISOString()
        }
      },
      message: 'Producto creado exitosamente'
    });

  } catch (error) {
    console.error('[Create Product Error]', error);
    
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
      error: error.message || 'Error al crear producto',
      code: 'CREATE_PRODUCT_ERROR'
    });
  }
};

// 2. PUT - Editar producto
export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    console.log('[Update Product] Updating product:', productId);
    
    const data = updateProductSchema.parse(req.body);

    // Verificar que el producto existe
    const productDoc = await getDoc(doc(db, 'productos', productId));
    if (!productDoc.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    const productData = productDoc.data();
    
    // Verificar permisos (solo el usuario que creó el producto puede editarlo)
    if (productData.id_usuario !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para editar este producto',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Si se está cambiando el código, verificar que no exista
    if (data.codigo_producto && data.codigo_producto !== productData.codigo_producto) {
      const productosRef = collection(db, 'productos');
      const q = query(productosRef, where('codigo_producto', '==', data.codigo_producto));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return res.status(400).json({
          success: false,
          error: 'El código de producto ya existe',
          code: 'PRODUCT_CODE_EXISTS'
        });
      }
    }

    // Calcular status automáticamente si se actualiza el stock
    let updateData = { ...data };
    if (data.cantidad_stock !== undefined || data.stock_minimo !== undefined) {
      const currentProduct = productDoc.data();
      const newCantidadStock = data.cantidad_stock !== undefined ? data.cantidad_stock : currentProduct.cantidad_stock;
      const newStockMinimo = data.stock_minimo !== undefined ? data.stock_minimo : currentProduct.stock_minimo;
      updateData.status_producto = calculateProductStatus(newCantidadStock, newStockMinimo);
    }

    // Actualizar producto
    updateData.fecha_actualizacion = serverTimestamp();

    await updateDoc(doc(db, 'productos', productId), updateData);

    // Obtener datos actualizados
    const updatedDoc = await getDoc(doc(db, 'productos', productId));
    const updatedData = updatedDoc.data();

    console.log('[Update Product] Producto actualizado exitosamente:', productId);

    res.json({
      success: true,
      data: {
        producto: {
          id: updatedDoc.id,
          ...updatedData
        }
      },
      message: 'Producto actualizado correctamente'
    });

  } catch (error) {
    console.error('[Update Product Error]', error);
    
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
      error: 'Error al actualizar producto',
      code: 'UPDATE_PRODUCT_ERROR'
    });
  }
};

// 3. DELETE - Eliminar producto
export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    console.log('[Delete Product] Deleting product:', productId);

    // Verificar que el producto existe
    const productDoc = await getDoc(doc(db, 'productos', productId));
    if (!productDoc.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    const productData = productDoc.data();
    
    // Verificar permisos
    if (productData.id_usuario !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para eliminar este producto',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    await deleteDoc(doc(db, 'productos', productId));

    console.log('[Delete Product] Producto eliminado exitosamente:', productId);

    res.json({
      success: true,
      data: {
        deleted_product: {
          id: productId,
          codigo_producto: productData.codigo_producto,
          nombre_producto: productData.nombre_producto
        }
      },
      message: 'Producto eliminado correctamente'
    });

  } catch (error) {
    console.error('[Delete Product Error]', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar producto',
      code: 'DELETE_PRODUCT_ERROR'
    });
  }
};

// Helper function para actualizar stock de producto
export const updateProductStock = async (productId, cantidadVendida, transaction = null) => {
  try {
    const productRef = doc(db, 'productos', productId);
    const productDoc = await getDoc(productRef);
    
    if (!productDoc.exists()) {
      throw new Error('Producto no encontrado');
    }

    const productData = productDoc.data();
    const nuevaCantidad = Math.max(0, (productData.cantidad_stock || 0) - cantidadVendida);
    const nuevoStatus = calculateProductStatus(nuevaCantidad, productData.stock_minimo || 5);
    
    const updateData = {
      cantidad_stock: nuevaCantidad,
      status_producto: nuevoStatus,
      fecha_actualizacion: serverTimestamp()
    };

    if (transaction) {
      await updateDoc(productRef, updateData);
    } else {
      await updateDoc(productRef, updateData);
    }

    return {
      id: productId,
      cantidad_anterior: productData.cantidad_stock,
      cantidad_nueva: nuevaCantidad,
      status_nuevo: nuevoStatus
    };
  } catch (error) {
    throw error;
  }
};

// 4. GET - Obtener producto individual por ID
export const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    console.log('[Get Product By ID] Obteniendo producto:', productId);

    // Verificar que el producto existe
    const productDoc = await getDoc(doc(db, 'productos', productId));
    
    if (!productDoc.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    const productData = productDoc.data();
    
    // Verificar permisos - el usuario solo puede ver sus propios productos
    if (productData.id_usuario !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para ver este producto',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    console.log('[Get Product By ID] Producto encontrado exitosamente:', productId);

    res.json({
      success: true,
      data: {
        producto: {
          id: productDoc.id,
          uuid_producto: productData.uuid_producto,
          codigo_producto: productData.codigo_producto,
          nombre_producto: productData.nombre_producto,
          descripcion: productData.descripcion,
          costo: productData.costo,
          precio: productData.precio,
          status_producto: productData.status_producto,
          fecha_creacion: productData.fecha_creacion,
          fecha_actualizacion: productData.fecha_actualizacion,
          id_usuario: productData.id_usuario
        }
      },
      message: 'Producto obtenido correctamente'
    });

  } catch (error) {
    console.error('[Get Product By ID Error]', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el producto',
      code: 'GET_PRODUCT_BY_ID_ERROR'
    });
  }
};

// 5. GET - Obtener todos los productos con paginación
export const getProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10,
      sortBy = 'fecha_creacion',
      sortOrder = 'desc'
    } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    console.log('[Get Products] Parámetros:', { page: pageNumber, limit: limitNumber, sortBy, sortOrder });

    // Construir query simple sin ordenamiento complejo
    let productosQuery = collection(db, 'productos');
    
    // Filtrar por usuario actual
    productosQuery = query(productosQuery, where('id_usuario', '==', req.user.id));
    
    // Ejecutar query
    const querySnapshot = await getDocs(productosQuery);
    let productos = [];
    
    querySnapshot.forEach((doc) => {
      const productData = doc.data();
      productos.push({
        id: doc.id,
        uuid_producto: productData.uuid_producto,
        codigo_producto: productData.codigo_producto,
        nombre_producto: productData.nombre_producto,
        descripcion: productData.descripcion,
        costo: productData.costo,
        precio: productData.precio,
        status_producto: productData.status_producto,
        fecha_creacion: productData.fecha_creacion,
        fecha_actualizacion: productData.fecha_actualizacion
      });
    });

    console.log(`[Get Products] Productos obtenidos: ${productos.length}`);

    // Paginación local
    const total = productos.length;
    const totalPages = Math.ceil(total / limitNumber);
    const offset = (pageNumber - 1) * limitNumber;
    const paginatedProducts = productos.slice(offset, offset + limitNumber);

    res.json({
      success: true,
      data: {
        productos: paginatedProducts,
        pagination: {
          current_page: pageNumber,
          per_page: limitNumber,
          total: total,
          total_pages: totalPages,
          has_next_page: pageNumber < totalPages,
          has_prev_page: pageNumber > 1
        }
      },
      message: `Se encontraron ${total} productos`
    });

  } catch (error) {
    console.error('[Get Products Error]', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener productos',
      code: 'GET_PRODUCTS_ERROR'
    });
  }
};

// 6. GET - Buscar productos por nombre o código
export const searchProducts = async (req, res) => {
  try {
    const { search, nombre, codigo } = req.query;
    
    console.log('[Search Products] Parámetros:', { search, nombre, codigo });

    const productosRef = collection(db, 'productos');
    let productosQuery = query(productosRef, where('id_usuario', '==', req.user.id));
    
    const querySnapshot = await getDocs(productosQuery);
    let productos = [];
    
    querySnapshot.forEach((doc) => {
      const productData = doc.data();
      productos.push({
        id: doc.id,
        ...productData
      });
    });

    console.log(`[Search Products] Productos obtenidos de base: ${productos.length}`);

    // Función helper para normalizar texto (quitar acentos)
    const normalizeText = (text) => {
      if (!text) return '';
      return text.normalize('NFD')
                 .replace(/[\u0300-\u036f]/g, '') // Remover acentos
                 .toLowerCase()
                 .trim();
    };

    // Búsqueda local (ya que Firestore no soporta búsqueda de texto completo nativa)
    let filteredProducts = productos;

    if (search) {
      const searchTerm = normalizeText(search);
      console.log(`[Search Products] Buscando normalizado: "${searchTerm}"`);
      filteredProducts = productos.filter(product => {
        const nombre = normalizeText(product.nombre_producto);
        const codigo = normalizeText(product.codigo_producto);
        const descripcion = normalizeText(product.descripcion);
        
        const match = nombre.includes(searchTerm) || 
                     codigo.includes(searchTerm) || 
                     descripcion.includes(searchTerm);
        
        if (match) {
          console.log(`[Search Products] Producto coincide: ${product.nombre_producto}`);
        }
        
        return match;
      });
    }

    if (nombre) {
      const nombreTerm = normalizeText(nombre);
      console.log(`[Search Products] Filtrando por nombre normalizado: "${nombreTerm}"`);
      filteredProducts = filteredProducts.filter(product =>
        normalizeText(product.nombre_producto).includes(nombreTerm)
      );
    }

    if (codigo) {
      const codigoTerm = normalizeText(codigo);
      console.log(`[Search Products] Filtrando por código normalizado: "${codigoTerm}"`);
      filteredProducts = filteredProducts.filter(product =>
        normalizeText(product.codigo_producto).includes(codigoTerm)
      );
    }

    console.log(`[Search Products] Productos encontrados: ${filteredProducts.length}`);

    res.json({
      success: true,
      data: {
        productos: filteredProducts,
        total: filteredProducts.length
      },
      message: `Se encontraron ${filteredProducts.length} productos`
    });

  } catch (error) {
    console.error('[Search Products Error]', error);
    res.status(500).json({
      success: false,
      error: 'Error al buscar productos',
      code: 'SEARCH_PRODUCTS_ERROR'
    });
  }
};

// 7. GET - Filtrar productos por status o precio
export const filterProducts = async (req, res) => {
  try {
    const { status, precio_min, precio_max } = req.query;
    
    console.log('[Filter Products] Filtros:', { status, precio_min, precio_max });

    const productosRef = collection(db, 'productos');
    let productosQuery = query(productosRef, where('id_usuario', '==', req.user.id));
    
    const querySnapshot = await getDocs(productosQuery);
    let productos = [];
    
    querySnapshot.forEach((doc) => {
      const productData = doc.data();
      productos.push({
        id: doc.id,
        ...productData
      });
    });

    // Aplicar filtros localmente
    let filteredProducts = productos;

    if (status) {
      filteredProducts = filteredProducts.filter(product => 
        product.status_producto === status
      );
    }

    if (precio_min) {
      const minPrice = parseFloat(precio_min);
      filteredProducts = filteredProducts.filter(product => 
        product.precio >= minPrice
      );
    }

    if (precio_max) {
      const maxPrice = parseFloat(precio_max);
      filteredProducts = filteredProducts.filter(product => 
        product.precio <= maxPrice
      );
    }

    console.log(`[Filter Products] Productos filtrados: ${filteredProducts.length}`);

    res.json({
      success: true,
      data: {
        productos: filteredProducts,
        total: filteredProducts.length,
        filters: {
          status,
          precio_min,
          precio_max
        }
      },
      message: `Se encontraron ${filteredProducts.length} productos`
    });

  } catch (error) {
    console.error('[Filter Products Error]', error);
    res.status(500).json({
      success: false,
      error: 'Error al filtrar productos',
      code: 'FILTER_PRODUCTS_ERROR'
    });
  }
};