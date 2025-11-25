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
  and
} from 'firebase/firestore';
import { db } from '../config/firebase-config.js';
import { z } from 'zod';

// Esquema para crear membresía
const createMembershipSchema = z.object({
  uuid_membresia: z.string().optional(),
  nombre_membresia: z.string().min(2, 'Nombre de membresía requerido'),
  precio: z.number().positive('El precio debe ser positivo'),
  meses: z.number().nonnegative().default(0),
  semanas: z.number().nonnegative().default(0),
  dias: z.number().nonnegative().default(0),
  tipo_membresia: z.enum(['mensual', 'semanal', 'anual', 'dias']),
  status_membresia: z.enum(['activo', 'inactivo']).default('activo')
});

// Esquema para actualizar membresía
const updateMembershipSchema = z.object({
  nombre_membresia: z.string().min(2, 'Nombre de membresía requerido').optional(),
  precio: z.number().positive('El precio debe ser positivo').optional(),
  meses: z.number().nonnegative().optional(),
  semanas: z.number().nonnegative().optional(),
  dias: z.number().nonnegative().optional(),
  tipo_membresia: z.enum(['mensual', 'semanal', 'anual', 'dias']).optional(),
  status_membresia: z.enum(['activo', 'inactivo']).optional()
});

// Esquema para búsqueda de membresías
const searchMembershipsSchema = z.object({
  search: z.string().optional(),
  tipo: z.enum(['mensual', 'semanal', 'anual', 'dias']).optional(),
  status: z.enum(['activo', 'inactivo']).optional(),
  precio_min: z.number().positive().optional(),
  precio_max: z.number().positive().optional()
});

// Helper function para generar UUID para membresías
const generateMembershipId = () => {
  return 'memb_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 1. POST - Crear nueva membresía
export const createMembership = async (req, res) => {
  try {
    console.log('[Create Membership] Request body:', req.body);
    
    const data = createMembershipSchema.parse(req.body);

    // Verificar que no existe una membresía con el mismo nombre
    const membershipsRef = collection(db, 'membresias');
    const existingQuery = query(
      membershipsRef,
      where('id_usuario', '==', req.user.id),
      where('nombre_membresia', '==', data.nombre_membresia)
    );
    
    const existingSnapshot = await getDocs(existingQuery);
    if (!existingSnapshot.empty) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe una membresía con ese nombre',
        code: 'MEMBERSHIP_NAME_EXISTS'
      });
    }

    // Crear datos de la membresía
    const membershipData = {
      uuid_membresia: data.uuid_membresia || generateMembershipId(),
      nombre_membresia: data.nombre_membresia,
      precio: data.precio,
      meses: data.meses,
      semanas: data.semanas,
      dias: data.dias,
      tipo_membresia: data.tipo_membresia,
      status_membresia: data.status_membresia,
      fecha_creacion: serverTimestamp(),
      id_usuario: req.user.id
    };

    // Crear la membresía en Firestore
    const docRef = await addDoc(membershipsRef, membershipData);

    console.log('[Create Membership] Membresía creada exitosamente:', docRef.id);

    res.status(201).json({
      success: true,
      data: {
        membresia: {
          id: docRef.id,
          ...membershipData,
          fecha_creacion: new Date().toISOString()
        }
      },
      message: 'Membresía creada exitosamente'
    });

  } catch (error) {
    console.error('[Create Membership Error]', error);
    
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
      error: error.message || 'Error al crear membresía',
      code: 'CREATE_MEMBERSHIP_ERROR'
    });
  }
};

// 2. PUT - Editar membresía
export const updateMembership = async (req, res) => {
  try {
    const { membershipId } = req.params;
    console.log('[Update Membership] Updating membership:', membershipId);
    
    const data = updateMembershipSchema.parse(req.body);

    // Verificar que la membresía existe
    const membershipDoc = await getDoc(doc(db, 'membresias', membershipId));
    if (!membershipDoc.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Membresía no encontrada',
        code: 'MEMBERSHIP_NOT_FOUND'
      });
    }

    const membershipData = membershipDoc.data();
    
    // Verificar permisos
    if (membershipData.id_usuario !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para editar esta membresía',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Si se está cambiando el nombre, verificar que no exista
    if (data.nombre_membresia && data.nombre_membresia !== membershipData.nombre_membresia) {
      const membershipsRef = collection(db, 'membresias');
      const existingQuery = query(
        membershipsRef,
        where('id_usuario', '==', req.user.id),
        where('nombre_membresia', '==', data.nombre_membresia)
      );
      
      const existingSnapshot = await getDocs(existingQuery);
      if (!existingSnapshot.empty) {
        return res.status(400).json({
          success: false,
          error: 'Ya existe una membresía con ese nombre',
          code: 'MEMBERSHIP_NAME_EXISTS'
        });
      }
    }

    // Preparar datos de actualización
    const updateData = {
      ...data,
      fecha_actualizacion: serverTimestamp()
    };

    await updateDoc(doc(db, 'membresias', membershipId), updateData);

    // Obtener datos actualizados
    const updatedDoc = await getDoc(doc(db, 'membresias', membershipId));
    const updatedData = updatedDoc.data();

    console.log('[Update Membership] Membresía actualizada exitosamente:', membershipId);

    res.json({
      success: true,
      data: {
        membresia: {
          id: updatedDoc.id,
          ...updatedData
        }
      },
      message: 'Membresía actualizada correctamente'
    });

  } catch (error) {
    console.error('[Update Membership Error]', error);
    
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
      error: 'Error al actualizar membresía',
      code: 'UPDATE_MEMBERSHIP_ERROR'
    });
  }
};

// 3. DELETE - Eliminar membresía
export const deleteMembership = async (req, res) => {
  try {
    const { membershipId } = req.params;
    console.log('[Delete Membership] Deleting membership:', membershipId);

    // Verificar que la membresía existe
    const membershipDoc = await getDoc(doc(db, 'membresias', membershipId));
    if (!membershipDoc.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Membresía no encontrada',
        code: 'MEMBERSHIP_NOT_FOUND'
      });
    }

    const membershipData = membershipDoc.data();
    
    // Verificar permisos
    if (membershipData.id_usuario !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para eliminar esta membresía',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Eliminar la membresía
    await deleteDoc(doc(db, 'membresias', membershipId));

    console.log('[Delete Membership] Membresía eliminada exitosamente:', membershipId);

    res.json({
      success: true,
      data: {
        deleted_membership: {
          id: membershipId,
          uuid_membresia: membershipData.uuid_membresia,
          nombre_membresia: membershipData.nombre_membresia
        }
      },
      message: 'Membresía eliminada correctamente'
    });

  } catch (error) {
    console.error('[Delete Membership Error]', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar membresía',
      code: 'DELETE_MEMBERSHIP_ERROR'
    });
  }
};

// 4. GET - Obtener todas las membresías con paginación
export const getMemberships = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10,
      sortBy = 'fecha_creacion',
      sortOrder = 'desc'
    } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    console.log('[Get Memberships] Parámetros:', { page: pageNumber, limit: limitNumber, sortBy, sortOrder });

    // Construir query
    let membershipsQuery = collection(db, 'membresias');
    
    // Filtrar por usuario actual
    membershipsQuery = query(membershipsQuery, where('id_usuario', '==', req.user.id));
    
    // Ejecutar query
    const querySnapshot = await getDocs(membershipsQuery);
    let membresias = [];
    
    querySnapshot.forEach((doc) => {
      const membershipData = doc.data();
      membresias.push({
        id: doc.id,
        ...membershipData
      });
    });

    console.log(`[Get Memberships] Membresías obtenidas: ${membresias.length}`);

    // Paginación local
    const total = membresias.length;
    const totalPages = Math.ceil(total / limitNumber);
    const offset = (pageNumber - 1) * limitNumber;
    const paginatedMemberships = membresias.slice(offset, offset + limitNumber);

    res.json({
      success: true,
      data: {
        membresias: paginatedMemberships,
        pagination: {
          current_page: pageNumber,
          per_page: limitNumber,
          total: total,
          total_pages: totalPages,
          has_next_page: pageNumber < totalPages,
          has_prev_page: pageNumber > 1
        }
      },
      message: `Se encontraron ${total} membresías`
    });

  } catch (error) {
    console.error('[Get Memberships Error]', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener membresías',
      code: 'GET_MEMBERSHIPS_ERROR'
    });
  }
};

// 4.1. GET - Obtener detalles de una membresía específica
export const getMembershipById = async (req, res) => {
  try {
    const { membershipId } = req.params;

    console.log('[Get Membership By ID] ID:', membershipId);

    const membershipRef = doc(db, 'membresias', membershipId);
    const membershipDoc = await getDoc(membershipRef);

    if (!membershipDoc.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Membresía no encontrada',
        code: 'MEMBERSHIP_NOT_FOUND'
      });
    }

    const membershipData = membershipDoc.data();

    // Verificar que la membresía pertenece al usuario
    if (membershipData.id_usuario !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para ver esta membresía',
        code: 'MEMBERSHIP_ACCESS_DENIED'
      });
    }

    console.log('[Get Membership By ID] Membresía encontrada:', membershipData.nombre_membresia);

    res.json({
      success: true,
      data: {
        membresia: {
          id: membershipDoc.id,
          ...membershipData
        }
      },
      message: 'Detalles de membresía obtenidos correctamente'
    });

  } catch (error) {
    console.error('[Get Membership By ID Error]', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener detalles de membresía',
      code: 'GET_MEMBERSHIP_BY_ID_ERROR'
    });
  }
};

// 5. GET - Buscar membresías
export const searchMemberships = async (req, res) => {
  try {
    const { q: search } = req.query;
    
    console.log('[Search Memberships] Parámetros:', { search });

    const membershipsRef = collection(db, 'membresias');
    let membershipsQuery = query(membershipsRef, where('id_usuario', '==', req.user.id));
    
    const querySnapshot = await getDocs(membershipsQuery);
    let membresias = [];
    
    querySnapshot.forEach((doc) => {
      const membershipData = doc.data();
      membresias.push({
        id: doc.id,
        ...membershipData
      });
    });

    console.log(`[Search Memberships] Membresías obtenidas de base: ${membresias.length}`);

    // Función helper para normalizar texto
    const normalizeText = (text) => {
      if (!text) return '';
      return text.normalize('NFD')
                 .replace(/[\u0300-\u036f]/g, '')
                 .toLowerCase()
                 .trim();
    };

    // Búsqueda local
    let filteredMemberships = membresias;

    if (search) {
      const searchTerm = normalizeText(search);
      console.log(`[Search Memberships] Buscando normalizado: "${searchTerm}"`);
      filteredMemberships = membresias.filter(membership => {
        const nombre = normalizeText(membership.nombre_membresia);
        const uuid = normalizeText(membership.uuid_membresia);
        const tipo = normalizeText(membership.tipo_membresia);
        
        return nombre.includes(searchTerm) || 
               uuid.includes(searchTerm) || 
               tipo.includes(searchTerm);
      });
    }

    console.log(`[Search Memberships] Membresías encontradas: ${filteredMemberships.length}`);

    res.json({
      success: true,
      data: {
        membresias: filteredMemberships,
        total: filteredMemberships.length
      },
      message: `Se encontraron ${filteredMemberships.length} membresías`
    });

  } catch (error) {
    console.error('[Search Memberships Error]', error);
    res.status(500).json({
      success: false,
      error: 'Error al buscar membresías',
      code: 'SEARCH_MEMBERSHIPS_ERROR'
    });
  }
};

// 6. GET - Filtrar membresías por status (activo, inactivo)
export const filterMembershipsByStatus = async (req, res) => {
  try {
    const { status } = req.query; // Cambiado de status_membresia a status
    
    console.log('[Filter Memberships By Status] Filtros:', { status });

    const membershipsRef = collection(db, 'membresias');
    let membershipsQuery = query(membershipsRef, where('id_usuario', '==', req.user.id));
    
    if (status) {
      membershipsQuery = query(membershipsQuery, where('status_membresia', '==', status));
    }
    
    const querySnapshot = await getDocs(membershipsQuery);
    let membresias = [];
    
    querySnapshot.forEach((doc) => {
      const membershipData = doc.data();
      membresias.push({
        id: doc.id,
        ...membershipData
      });
    });

    console.log(`[Filter Memberships By Status] Membresías filtradas: ${membresias.length}`);

    res.json({
      success: true,
      data: {
        membresias: membresias,
        total: membresias.length,
        filters: {
          status_membresia: status
        }
      },
      message: `Se encontraron ${membresias.length} membresías`
    });

  } catch (error) {
    console.error('[Filter Memberships By Status Error]', error);
    res.status(500).json({
      success: false,
      error: 'Error al filtrar membresías',
      code: 'FILTER_MEMBERSHIPS_STATUS_ERROR'
    });
  }
};

// 7. GET - Filtrar membresías por tipo (mensual, semanal, etc)
export const filterMembershipsByType = async (req, res) => {
  try {
    const { tipo, precio_min, precio_max } = req.query; // Cambiado de tipo_membresia a tipo
    
    console.log('[Filter Memberships By Type] Filtros:', { tipo, precio_min, precio_max });

    const membershipsRef = collection(db, 'membresias');
    let membershipsQuery = query(membershipsRef, where('id_usuario', '==', req.user.id));
    
    if (tipo) {
      membershipsQuery = query(membershipsQuery, where('tipo_membresia', '==', tipo));
    }
    
    const querySnapshot = await getDocs(membershipsQuery);
    let membresias = [];
    
    querySnapshot.forEach((doc) => {
      const membershipData = doc.data();
      membresias.push({
        id: doc.id,
        ...membershipData
      });
    });

    // Filtrar por precio localmente
    if (precio_min || precio_max) {
      membresias = membresias.filter(membership => {
        const precio = membership.precio;
        if (precio_min && precio < parseFloat(precio_min)) return false;
        if (precio_max && precio > parseFloat(precio_max)) return false;
        return true;
      });
    }

    console.log(`[Filter Memberships By Type] Membresías filtradas: ${membresias.length}`);

    res.json({
      success: true,
      data: {
        membresias: membresias,
        total: membresias.length,
        filters: {
          tipo_membresia: tipo,
          precio_min,
          precio_max
        }
      },
      message: `Se encontraron ${membresias.length} membresías`
    });

  } catch (error) {
    console.error('[Filter Memberships By Type Error]', error);
    res.status(500).json({
      success: false,
      error: 'Error al filtrar membresías',
      code: 'FILTER_MEMBERSHIPS_TYPE_ERROR'
    });
  }
};

// 8. PUT - Habilitar membresía
export const enableMembership = async (req, res) => {
  try {
    const { membershipId } = req.params;
    console.log('[Enable Membership] Enabling membership:', membershipId);

    // Verificar que la membresía existe
    const membershipDoc = await getDoc(doc(db, 'membresias', membershipId));
    if (!membershipDoc.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Membresía no encontrada',
        code: 'MEMBERSHIP_NOT_FOUND'
      });
    }

    const membershipData = membershipDoc.data();
    
    // Verificar permisos
    if (membershipData.id_usuario !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para modificar esta membresía',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Actualizar status a activo
    await updateDoc(doc(db, 'membresias', membershipId), {
      status_membresia: 'activo',
      fecha_actualizacion: serverTimestamp()
    });

    console.log('[Enable Membership] Membresía habilitada exitosamente:', membershipId);

    res.json({
      success: true,
      data: {
        membresia: {
          id: membershipId,
          uuid_membresia: membershipData.uuid_membresia,
          nombre_membresia: membershipData.nombre_membresia,
          status_membresia: 'activo'
        }
      },
      message: 'Membresía habilitada correctamente'
    });

  } catch (error) {
    console.error('[Enable Membership Error]', error);
    res.status(500).json({
      success: false,
      error: 'Error al habilitar membresía',
      code: 'ENABLE_MEMBERSHIP_ERROR'
    });
  }
};

// 9. PUT - Deshabilitar membresía
export const disableMembership = async (req, res) => {
  try {
    const { membershipId } = req.params;
    console.log('[Disable Membership] Disabling membership:', membershipId);

    // Verificar que la membresía existe
    const membershipDoc = await getDoc(doc(db, 'membresias', membershipId));
    if (!membershipDoc.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Membresía no encontrada',
        code: 'MEMBERSHIP_NOT_FOUND'
      });
    }

    const membershipData = membershipDoc.data();
    
    // Verificar permisos
    if (membershipData.id_usuario !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para modificar esta membresía',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Actualizar status a inactivo
    await updateDoc(doc(db, 'membresias', membershipId), {
      status_membresia: 'inactivo',
      fecha_actualizacion: serverTimestamp()
    });

    console.log('[Disable Membership] Membresía deshabilitada exitosamente:', membershipId);

    res.json({
      success: true,
      data: {
        membresia: {
          id: membershipId,
          uuid_membresia: membershipData.uuid_membresia,
          nombre_membresia: membershipData.nombre_membresia,
          status_membresia: 'inactivo'
        }
      },
      message: 'Membresía deshabilitada correctamente'
    });

  } catch (error) {
    console.error('[Disable Membership Error]', error);
    res.status(500).json({
      success: false,
      error: 'Error al deshabilitar membresía',
      code: 'DISABLE_MEMBERSHIP_ERROR'
    });
  }
};