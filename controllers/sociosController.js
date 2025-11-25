import { db } from '../config/firebase-config.js';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, orderBy, limit, startAfter, endBefore, limitToLast, Timestamp } from 'firebase/firestore';
import { z } from 'zod';

// Esquemas de validación
const createSocioSchema = z.object({
  nombre_socio: z.string().min(2, 'Nombre requerido'),
  apellido_paterno: z.string().min(2, 'Apellido paterno requerido'),
  apellido_materno: z.string().optional().nullable(),
  telefono: z.string().min(10, 'Teléfono inválido'),
  correo_electronico: z.string().email('Email inválido'),
  status: z.enum(['activo', 'inactivo']).default('activo'),
  // Campos para crear membresía inicial si se desea
  tipo_membresia: z.string().optional(),
  fecha_inicio: z.string().optional(),
  observaciones_membresia: z.string().optional()
});

const updateSocioSchema = createSocioSchema.partial();

// Schema para membresías
const createMembresiaSchema = z.object({
  uuid_socio: z.string().min(1, 'ID de socio requerido'),
  uuid_membresia: z.string().min(1, 'Tipo de membresía requerido'),
  fecha_inicio: z.string().refine((date) => !isNaN(Date.parse(date)), 'Fecha de inicio inválida'),
  observaciones: z.string().optional(),
  status_membresia_socio: z.enum(['pagado', 'no_pagado']).default('no_pagado')
});

// 1- POST crear socio
export const createSocio = async (req, res) => {
  try {
    const data = createSocioSchema.parse(req.body);

    // Extraer datos de membresía si se proporcionan
    const { tipo_membresia, fecha_inicio, observaciones_membresia, ...datosSocio } = data;

    // Crear socio en Firestore
    const socioData = {
      ...datosSocio,
      fecha_creacion: Timestamp.now(),
      uuid_membresia_socio: null // Se llenará cuando se asigne una membresía
    };

    const socioRef = await addDoc(collection(db, 'socios'), socioData);
    const socioId = socioRef.id;

    // Si se proporcionan datos de membresía, crear la membresía
    let membresia = null;
    if (tipo_membresia && fecha_inicio) {
      const fechaInicio = new Date(fecha_inicio);
      const fechaFin = new Date(fechaInicio);
      fechaFin.setMonth(fechaInicio.getMonth() + 1); // Por defecto 1 mes

      const membresiaData = {
        uuid_membresia_socio: socioId,
        uuid_membresia: tipo_membresia,
        uuid_socio: socioId,
        observaciones: observaciones_membresia || '',
        fecha_inicio: Timestamp.fromDate(fechaInicio),
        fecha_fin: Timestamp.fromDate(fechaFin),
        fecha_creacion: Timestamp.now(),
        status_membresia_socio: 'no_pagado'
      };

      const membresiaRef = await addDoc(collection(db, 'membresia_socio'), membresiaData);
      membresia = { id: membresiaRef.id, ...membresiaData };

      // Actualizar el socio con el ID de la membresía
      await updateDoc(doc(db, 'socios', socioId), {
        uuid_membresia_socio: membresiaRef.id
      });
    }

    // Obtener el socio creado con todos sus datos
    const socioCreado = await getDoc(doc(db, 'socios', socioId));
    
    res.status(201).json({
      success: true,
      data: { 
        socio: { id: socioId, ...socioCreado.data() },
        membresia: membresia
      }
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

// 12- GET socios (con paginación)
export const getSocios = async (req, res) => {
  try {
    const { 
      limit: limitParam = 10, 
      lastDocId, 
      status, 
      search,
      direction = 'next' 
    } = req.query;

    const limitNum = parseInt(limitParam);
    
    // Construir query base
    let q = query(
      collection(db, 'socios'),
      orderBy('fecha_creacion', 'desc')
    );

    // Aplicar filtro por status si se especifica
    if (status && status !== 'todos') {
      q = query(
        collection(db, 'socios'),
        where('status', '==', status),
        orderBy('fecha_creacion', 'desc')
      );
    }

    // Aplicar paginación
    if (lastDocId) {
      const lastDoc = await getDoc(doc(db, 'socios', lastDocId));
      if (lastDoc.exists()) {
        if (direction === 'prev') {
          q = query(q, endBefore(lastDoc), limitToLast(limitNum));
        } else {
          q = query(q, startAfter(lastDoc), limit(limitNum));
        }
      } else {
        q = query(q, limit(limitNum));
      }
    } else {
      q = query(q, limit(limitNum));
    }

    const querySnapshot = await getDocs(q);
    let socios = [];

    for (const docSnap of querySnapshot.docs) {
      const socioData = { id: docSnap.id, ...docSnap.data() };
      
      // Formatear fecha
      if (socioData.fecha_creacion) {
        socioData.fecha_creacion = socioData.fecha_creacion.toDate().toISOString();
      }

      // Buscar membresía activa si existe
      if (socioData.uuid_membresia_socio) {
        try {
          const membresiaDoc = await getDoc(doc(db, 'membresia_socio', socioData.uuid_membresia_socio));
          if (membresiaDoc.exists()) {
            const membresiaData = membresiaDoc.data();
            socioData.membresia_activa = {
              id: membresiaDoc.id,
              ...membresiaData,
              fecha_inicio: membresiaData.fecha_inicio?.toDate().toISOString(),
              fecha_fin: membresiaData.fecha_fin?.toDate().toISOString(),
              fecha_creacion: membresiaData.fecha_creacion?.toDate().toISOString()
            };
          }
        } catch (error) {
          console.error('Error obteniendo membresía:', error);
        }
      }

      // Aplicar filtro de búsqueda si se especifica
      if (search) {
        const searchLower = search.toLowerCase();
        const nombreCompleto = `${socioData.nombre_socio || ''} ${socioData.apellido_paterno || ''} ${socioData.apellido_materno || ''}`.toLowerCase();
        const email = (socioData.correo_electronico || '').toLowerCase();
        
        if (nombreCompleto.includes(searchLower) || email.includes(searchLower)) {
          socios.push(socioData);
        }
      } else {
        socios.push(socioData);
      }
    }

    res.json({
      success: true,
      data: { 
        socios,
        hasMore: querySnapshot.docs.length === limitNum,
        lastDocId: querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1].id : null
      }
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

// Ver detalles de un socio en concreto
export const getSocioById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Getting socio with ID:', id);

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID de socio requerido',
        code: 'SOCIO_ID_REQUIRED'
      });
    }

    const socioDoc = await getDoc(doc(db, 'socios', id));
    console.log('Socio doc exists:', socioDoc.exists());
    
    if (!socioDoc.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Socio no encontrado',
        code: 'SOCIO_NOT_FOUND'
      });
    }

    const socioData = { id: socioDoc.id, ...socioDoc.data() };
    console.log('Socio data:', socioData);
    
    // Formatear fecha
    if (socioData.fecha_creacion && socioData.fecha_creacion.toDate) {
      socioData.fecha_creacion = socioData.fecha_creacion.toDate().toISOString();
    }

    // Obtener todas las membresías del socio con información completa
    try {
      const membresiasQuery = query(
        collection(db, 'membresia_socio'),
        where('uuid_socio', '==', id)
      );

      const membresiasSnapshot = await getDocs(membresiasQuery);
      const membresias = [];
      
      for (const docRef of membresiasSnapshot.docs) {
        const membresiaData = docRef.data();
        const membresiaCompleta = {
          id: docRef.id,
          ...membresiaData,
          fecha_inicio: membresiaData.fecha_inicio?.toDate ? membresiaData.fecha_inicio.toDate().toISOString() : membresiaData.fecha_inicio,
          fecha_fin: membresiaData.fecha_fin?.toDate ? membresiaData.fecha_fin.toDate().toISOString() : membresiaData.fecha_fin,
          fecha_creacion: membresiaData.fecha_creacion?.toDate ? membresiaData.fecha_creacion.toDate().toISOString() : membresiaData.fecha_creacion
        };
        
        // Obtener información completa de la membresía desde la colección memberships
        if (membresiaData.uuid_membresia) {
          try {
            const membershipQuery = query(
              collection(db, 'memberships'),
              where('uuid_membresia', '==', membresiaData.uuid_membresia)
            );
            const membershipSnapshot = await getDocs(membershipQuery);
            
            if (!membershipSnapshot.empty) {
              const membershipDoc = membershipSnapshot.docs[0];
              const membershipData = membershipDoc.data();
              membresiaCompleta.informacion_membresia = {
                id: membershipDoc.id,
                nombre_membresia: membershipData.nombre_membresia,
                precio: membershipData.precio,
                tipo_membresia: membershipData.tipo_membresia,
                meses: membershipData.meses || 0,
                semanas: membershipData.semanas || 0,
                dias: membershipData.dias || 0
              };
            }
          } catch (membershipError) {
            console.warn('Error obteniendo información de membresía:', membershipError.message);
          }
        }
        
        membresias.push(membresiaCompleta);
      }

      // Ordenar por fecha de creación en JavaScript
      membresias.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
      socioData.membresias = membresias;
    } catch (membresiaError) {
      console.warn('Error obteniendo membresías:', membresiaError.message);
      socioData.membresias = [];
    }

    res.json({
      success: true,
      data: { socio: socioData }
    });
  } catch (error) {
    console.error('[Get Socio Error]', error.message, error.stack);
    res.status(500).json({
      success: false,
      error: 'Error al obtener socio',
      code: 'GET_SOCIO_ERROR'
    });
  }
};

// 2- PUT modificar socio
export const updateSocio = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = updateSocioSchema.parse(req.body);

    // Excluir campos de membresía del update del socio
    const { tipo_membresia, fecha_inicio, observaciones_membresia, ...socioUpdateData } = updateData;

    await updateDoc(doc(db, 'socios', id), socioUpdateData);

    // Obtener socio actualizado
    const socioActualizado = await getDoc(doc(db, 'socios', id));
    
    if (!socioActualizado.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Socio no encontrado',
        code: 'SOCIO_NOT_FOUND'
      });
    }

    const socioData = { id: socioActualizado.id, ...socioActualizado.data() };
    
    // Formatear fecha
    if (socioData.fecha_creacion) {
      socioData.fecha_creacion = socioData.fecha_creacion.toDate().toISOString();
    }

    res.json({
      success: true,
      data: { socio: socioData }
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

// 5- DELETE socio
export const deleteSocio = async (req, res) => {
  try {
    const { id } = req.params;

    // Primero eliminar todas las membresías asociadas
    const membresiasQuery = query(
      collection(db, 'membresia_socio'),
      where('uuid_socio', '==', id)
    );

    const membresiasSnapshot = await getDocs(membresiasQuery);
    const deletePromises = membresiasSnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );

    await Promise.all(deletePromises);

    // Luego eliminar el socio
    await deleteDoc(doc(db, 'socios', id));

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

// 3- Deshabilitar socio
export const disableSocio = async (req, res) => {
  try {
    const { id } = req.params;

    await updateDoc(doc(db, 'socios', id), {
      status: 'inactivo'
    });

    const socioActualizado = await getDoc(doc(db, 'socios', id));
    const socioData = { id: socioActualizado.id, ...socioActualizado.data() };
    
    if (socioData.fecha_creacion) {
      socioData.fecha_creacion = socioData.fecha_creacion.toDate().toISOString();
    }

    res.json({
      success: true,
      data: { socio: socioData },
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

// 4- Habilitar socio
export const enableSocio = async (req, res) => {
  try {
    const { id } = req.params;

    await updateDoc(doc(db, 'socios', id), {
      status: 'activo'
    });

    const socioActualizado = await getDoc(doc(db, 'socios', id));
    const socioData = { id: socioActualizado.id, ...socioActualizado.data() };
    
    if (socioData.fecha_creacion) {
      socioData.fecha_creacion = socioData.fecha_creacion.toDate().toISOString();
    }

    res.json({
      success: true,
      data: { socio: socioData },
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

// 8- Buscar socio por id/nombre
export const searchSocios = async (req, res) => {
  try {
    const { q: searchQuery, limit: limitParam = 20 } = req.query;
    
    if (!searchQuery) {
      return res.status(400).json({
        success: false,
        error: 'Query de búsqueda requerido',
        code: 'SEARCH_QUERY_REQUIRED'
      });
    }

    // Obtener todos los socios y filtrar localmente (Firebase no tiene búsqueda de texto completa nativa)
    const q = query(
      collection(db, 'socios'),
      orderBy('fecha_creacion', 'desc'),
      limit(parseInt(limitParam))
    );

    const querySnapshot = await getDocs(q);
    const socios = [];

    querySnapshot.forEach(doc => {
      const socioData = { id: doc.id, ...doc.data() };
      
      // Formatear fecha
      if (socioData.fecha_creacion) {
        socioData.fecha_creacion = socioData.fecha_creacion.toDate().toISOString();
      }

      const searchLower = searchQuery.toLowerCase();
      const nombreCompleto = `${socioData.nombre_socio || ''} ${socioData.apellido_paterno || ''} ${socioData.apellido_materno || ''}`.toLowerCase();
      const email = (socioData.correo_electronico || '').toLowerCase();
      const id = (socioData.id || '').toLowerCase();

      if (nombreCompleto.includes(searchLower) || 
          email.includes(searchLower) || 
          id.includes(searchLower)) {
        socios.push(socioData);
      }
    });

    res.json({
      success: true,
      data: { socios }
    });
  } catch (error) {
    console.error('[Search Socios Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al buscar socios',
      code: 'SEARCH_SOCIOS_ERROR'
    });
  }
};

// Filtrar socios por status
export const filterSociosByStatus = async (req, res) => {
  try {
    const { status, limit: limitParam = 50 } = req.query;

    if (!status || !['activo', 'inactivo'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status requerido (activo o inactivo)',
        code: 'STATUS_REQUIRED'
      });
    }

    const limitNum = parseInt(limitParam);
    if (isNaN(limitNum) || limitNum <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Límite inválido',
        code: 'INVALID_LIMIT'
      });
    }

    // Crear query sin orderBy inicialmente para evitar errores de índice
    const q = query(
      collection(db, 'socios'),
      where('status', '==', status),
      limit(limitNum)
    );

    const querySnapshot = await getDocs(q);
    const socios = querySnapshot.docs.map(doc => {
      const data = { id: doc.id, ...doc.data() };
      if (data.fecha_creacion && data.fecha_creacion.toDate) {
        data.fecha_creacion = data.fecha_creacion.toDate().toISOString();
      }
      return data;
    });

    // Ordenar por fecha de creación en JavaScript
    socios.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));

    res.json({
      success: true,
      data: { socios, total: socios.length }
    });
  } catch (error) {
    console.error('[Filter Socios By Status Error]', error.message, error.stack);
    res.status(500).json({
      success: false,
      error: 'Error al filtrar socios por status',
      code: 'FILTER_SOCIOS_STATUS_ERROR'
    });
  }
};

// 9- Ver últimos socios del día
export const getLatestSociosToday = async (req, res) => {
  try {
    const { limit: limitParam = 10 } = req.query;
    
    // Obtener inicio y fin del día actual
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const q = query(
      collection(db, 'socios'),
      where('fecha_creacion', '>=', Timestamp.fromDate(startOfDay)),
      where('fecha_creacion', '<=', Timestamp.fromDate(endOfDay)),
      orderBy('fecha_creacion', 'desc'),
      limit(parseInt(limitParam))
    );

    const querySnapshot = await getDocs(q);
    const socios = querySnapshot.docs.map(doc => {
      const data = { id: doc.id, ...doc.data() };
      if (data.fecha_creacion) {
        data.fecha_creacion = data.fecha_creacion.toDate().toISOString();
      }
      return data;
    });

    res.json({
      success: true,
      data: { socios, total: socios.length }
    });
  } catch (error) {
    console.error('[Get Latest Socios Today Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al obtener últimos socios del día',
      code: 'GET_LATEST_SOCIOS_ERROR'
    });
  }
};

// 10- Mostrar todos los socios (sin paginación)
export const getAllSocios = async (req, res) => {
  try {
    const q = query(
      collection(db, 'socios'),
      orderBy('fecha_creacion', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const socios = querySnapshot.docs.map(doc => {
      const data = { id: doc.id, ...doc.data() };
      if (data.fecha_creacion) {
        data.fecha_creacion = data.fecha_creacion.toDate().toISOString();
      }
      return data;
    });

    res.json({
      success: true,
      data: { socios, total: socios.length }
    });
  } catch (error) {
    console.error('[Get All Socios Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al obtener todos los socios',
      code: 'GET_ALL_SOCIOS_ERROR'
    });
  }
};

// 11- Contar socios
export const countSocios = async (req, res) => {
  try {
    const { status } = req.query;

    let q = query(collection(db, 'socios'));
    
    if (status && status !== 'todos') {
      q = query(collection(db, 'socios'), where('status', '==', status));
    }

    const querySnapshot = await getDocs(q);
    const total = querySnapshot.size;

    res.json({
      success: true,
      data: { total }
    });
  } catch (error) {
    console.error('[Count Socios Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al contar socios',
      code: 'COUNT_SOCIOS_ERROR'
    });
  }
};

// ====== FUNCIONES PARA GESTIÓN DE MEMBRESÍAS ======

// 1- Asignar membresías al socio
export const assignMembership = async (req, res) => {
  try {
    const { socioId } = req.params;
    const membresiaData = createMembresiaSchema.parse(req.body);

    // Verificar que el socio existe
    const socioDoc = await getDoc(doc(db, 'socios', socioId));
    if (!socioDoc.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Socio no encontrado',
        code: 'SOCIO_NOT_FOUND'
      });
    }

    // Verificar que la membresía existe y está activa
    const membershipQuery = query(
      collection(db, 'membresias'),
      where('uuid_membresia', '==', membresiaData.uuid_membresia)
    );
    const membershipSnapshot = await getDocs(membershipQuery);
    
    if (membershipSnapshot.empty) {
      return res.status(404).json({
        success: false,
        error: 'Membresía no encontrada',
        code: 'MEMBERSHIP_NOT_FOUND'
      });
    }

    const membershipDoc = membershipSnapshot.docs[0];
    const membershipInfo = membershipDoc.data();

    if (membershipInfo.status_membresia !== 'activo') {
      return res.status(400).json({
        success: false,
        error: 'La membresía no está activa',
        code: 'MEMBERSHIP_INACTIVE'
      });
    }

    // Calcular fecha de fin basada en la duración de la membresía
    const fechaInicio = new Date(membresiaData.fecha_inicio);
    let fechaFin = new Date(fechaInicio);
    
    // Agregar tiempo según el tipo de membresía
    if (membershipInfo.meses > 0) {
      fechaFin.setMonth(fechaFin.getMonth() + membershipInfo.meses);
    }
    if (membershipInfo.semanas > 0) {
      fechaFin.setDate(fechaFin.getDate() + (membershipInfo.semanas * 7));
    }
    if (membershipInfo.dias > 0) {
      fechaFin.setDate(fechaFin.getDate() + membershipInfo.dias);
    }

    const nuevaMembresia = {
      uuid_socio: socioId,
      uuid_membresia: membresiaData.uuid_membresia,
      observaciones: membresiaData.observaciones || '',
      fecha_inicio: Timestamp.fromDate(fechaInicio),
      fecha_fin: Timestamp.fromDate(fechaFin),
      fecha_creacion: Timestamp.now(),
      status_membresia_socio: membresiaData.status_membresia_socio || 'no_pagado'
    };

    const membresiaRef = await addDoc(collection(db, 'membresia_socio'), nuevaMembresia);

    // Actualizar el socio con la referencia a la membresía activa
    await updateDoc(doc(db, 'socios', socioId), {
      uuid_membresia_socio: membresiaRef.id
    });

    // Preparar respuesta con información completa
    const membresiaCompleta = {
      id: membresiaRef.id,
      ...nuevaMembresia,
      fecha_inicio: fechaInicio.toISOString(),
      fecha_fin: fechaFin.toISOString(),
      fecha_creacion: new Date().toISOString(),
      informacion_membresia: {
        nombre_membresia: membershipInfo.nombre_membresia,
        precio: membershipInfo.precio,
        tipo_membresia: membershipInfo.tipo_membresia,
        meses: membershipInfo.meses,
        semanas: membershipInfo.semanas,
        dias: membershipInfo.dias
      }
    };

    res.status(201).json({
      success: true,
      data: { 
        membresia: membresiaCompleta
      },
      message: 'Membresía asignada correctamente'
    });
  } catch (error) {
    console.error('[Assign Membership Error]', error.message, error.stack);
    res.status(400).json({
      success: false,
      error: error.message || 'Error al asignar membresía',
      code: 'ASSIGN_MEMBERSHIP_ERROR'
    });
  }
};

// 2- Cobrar membresías al socio (cambiar status a pagado)
export const payMembership = async (req, res) => {
  try {
    const { membresiaId } = req.params;

    await updateDoc(doc(db, 'membresia_socio', membresiaId), {
      status_membresia_socio: 'pagado'
    });

    const membresiaActualizada = await getDoc(doc(db, 'membresia_socio', membresiaId));
    
    if (!membresiaActualizada.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Membresía no encontrada',
        code: 'MEMBERSHIP_NOT_FOUND'
      });
    }

    const membresiaData = { id: membresiaActualizada.id, ...membresiaActualizada.data() };

    res.json({
      success: true,
      data: { membresia: membresiaData },
      message: 'Membresía pagada'
    });
  } catch (error) {
    console.error('[Pay Membership Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al cobrar membresía',
      code: 'PAY_MEMBERSHIP_ERROR'
    });
  }
};

// 4- PUT editar membresia_socio
export const updateMembership = async (req, res) => {
  try {
    const { membresiaId } = req.params;
    const updateData = req.body;

    // Si se actualiza la fecha de inicio, recalcular fecha de fin
    if (updateData.fecha_inicio) {
      const fechaInicio = new Date(updateData.fecha_inicio);
      const fechaFin = new Date(fechaInicio);
      fechaFin.setMonth(fechaInicio.getMonth() + 1);
      
      updateData.fecha_inicio = Timestamp.fromDate(fechaInicio);
      updateData.fecha_fin = Timestamp.fromDate(fechaFin);
    }

    await updateDoc(doc(db, 'membresia_socio', membresiaId), updateData);

    const membresiaActualizada = await getDoc(doc(db, 'membresia_socio', membresiaId));
    
    if (!membresiaActualizada.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Membresía no encontrada',
        code: 'MEMBERSHIP_NOT_FOUND'
      });
    }

    const membresiaData = { id: membresiaActualizada.id, ...membresiaActualizada.data() };

    res.json({
      success: true,
      data: { membresia: membresiaData }
    });
  } catch (error) {
    console.error('[Update Membership Error]', error.message);
    res.status(400).json({
      success: false,
      error: error.message || 'Error al actualizar membresía',
      code: 'UPDATE_MEMBERSHIP_ERROR'
    });
  }
};

// 5- DELETE eliminar membresia_socio
export const deleteMembership = async (req, res) => {
  try {
    const { membresiaId } = req.params;

    // Obtener la membresía antes de eliminarla para actualizar el socio
    const membresiaDoc = await getDoc(doc(db, 'membresia_socio', membresiaId));
    
    if (membresiaDoc.exists()) {
      const membresiaData = membresiaDoc.data();
      
      // Actualizar el socio para quitar la referencia
      if (membresiaData.uuid_socio) {
        const socioDoc = await getDoc(doc(db, 'socios', membresiaData.uuid_socio));
        if (socioDoc.exists() && socioDoc.data().uuid_membresia_socio === membresiaId) {
          await updateDoc(doc(db, 'socios', membresiaData.uuid_socio), {
            uuid_membresia_socio: null
          });
        }
      }
    }

    await deleteDoc(doc(db, 'membresia_socio', membresiaId));

    res.json({
      success: true,
      message: 'Membresía eliminada correctamente'
    });
  } catch (error) {
    console.error('[Delete Membership Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar membresía',
      code: 'DELETE_MEMBERSHIP_ERROR'
    });
  }
};

// 6- Cambiar status en tiempo real (función para automatización)
export const updateMembershipStatus = async (req, res) => {
  try {
    // Esta función puede ser llamada por un cron job o manualmente
    // para actualizar el status de membresías vencidas
    
    const now = Timestamp.now();
    
    // Buscar todas las membresías pagadas que han vencido
    const q = query(
      collection(db, 'membresia_socio'),
      where('status_membresia_socio', '==', 'pagado'),
      where('fecha_fin', '<', now)
    );

    const querySnapshot = await getDocs(q);
    const updatePromises = [];

    querySnapshot.docs.forEach(doc => {
      updatePromises.push(
        updateDoc(doc.ref, {
          status_membresia_socio: 'no_pagado'
        })
      );
    });

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: `${updatePromises.length} membresías actualizadas`,
      data: { updated: updatePromises.length }
    });
  } catch (error) {
    console.error('[Update Membership Status Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar status de membresías',
      code: 'UPDATE_MEMBERSHIP_STATUS_ERROR'
    });
  }
};

// Obtener todas las membresías de un socio
export const getMembershipsBySocio = async (req, res) => {
  try {
    const { socioId } = req.params;

    if (!socioId) {
      return res.status(400).json({
        success: false,
        error: 'ID de socio requerido',
        code: 'SOCIO_ID_REQUIRED'
      });
    }

    // Verificar que el socio existe
    const socioDoc = await getDoc(doc(db, 'socios', socioId));
    if (!socioDoc.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Socio no encontrado',
        code: 'SOCIO_NOT_FOUND'
      });
    }

    // Obtener membresías del socio sin orderBy para evitar errores de índice
    const q = query(
      collection(db, 'membresia_socio'),
      where('uuid_socio', '==', socioId)
    );

    const querySnapshot = await getDocs(q);
    const membresias = [];
    
    for (const docRef of querySnapshot.docs) {
      const data = docRef.data();
      const membresiaCompleta = {
        id: docRef.id,
        ...data,
        fecha_inicio: data.fecha_inicio?.toDate ? data.fecha_inicio.toDate().toISOString() : data.fecha_inicio,
        fecha_fin: data.fecha_fin?.toDate ? data.fecha_fin.toDate().toISOString() : data.fecha_fin,
        fecha_creacion: data.fecha_creacion?.toDate ? data.fecha_creacion.toDate().toISOString() : data.fecha_creacion
      };
      
      // Obtener información completa de la membresía
      if (data.uuid_membresia) {
        try {
          const membershipQuery = query(
            collection(db, 'membresias'),
            where('uuid_membresia', '==', data.uuid_membresia)
          );
          const membershipSnapshot = await getDocs(membershipQuery);
          
          if (!membershipSnapshot.empty) {
            const membershipDoc = membershipSnapshot.docs[0];
            const membershipData = membershipDoc.data();
            membresiaCompleta.informacion_membresia = {
              id: membershipDoc.id,
              nombre_membresia: membershipData.nombre_membresia,
              precio: membershipData.precio,
              tipo_membresia: membershipData.tipo_membresia,
              meses: membershipData.meses,
              semanas: membershipData.semanas,
              dias: membershipData.dias,
              status_membresia: membershipData.status_membresia
            };
          }
        } catch (membershipError) {
          console.warn('Error obteniendo información de membresía:', membershipError.message);
        }
      }
      
      membresias.push(membresiaCompleta);
    }

    // Ordenar por fecha de creación en JavaScript
    membresias.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));

    res.json({
      success: true,
      data: { membresias, total: membresias.length }
    });
  } catch (error) {
    console.error('[Get Memberships By Socio Error]', error.message, error.stack);
    res.status(500).json({
      success: false,
      error: 'Error al obtener membresías del socio',
      code: 'GET_MEMBERSHIPS_BY_SOCIO_ERROR'
    });
  }
};

// Obtener membresías disponibles para asignar a socios
export const getAvailableMemberships = async (req, res) => {
  try {
    console.log('🔍 Getting available memberships...');
    
    // Usar la misma lógica que el controlador de membresías
    const querySnapshot = await getDocs(collection(db, 'membresias'));
    console.log('📊 Total memberships found:', querySnapshot.docs.length);
    
    const todasMembresias = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('📋 All memberships:', todasMembresias.map(m => ({
      id: m.id, 
      nombre: m.nombre_membresia, 
      status: m.status_membresia
    })));

    // Filtrar solo las activas
    const membresiasActivas = todasMembresias.filter(m => {
      console.log(`✅ Checking membership ${m.nombre_membresia}: status = "${m.status_membresia}" (active: ${m.status_membresia === 'activo'})`);
      return m.status_membresia === 'activo';
    });
    
    console.log('🟢 Active memberships found:', membresiasActivas.length);

    // Formatear fechas y ordenar
    const membresias = membresiasActivas.map(data => {
      if (data.fecha_creacion && data.fecha_creacion.toDate) {
        data.fecha_creacion = data.fecha_creacion.toDate().toISOString();
      }
      if (data.fecha_actualizacion && data.fecha_actualizacion.toDate) {
        data.fecha_actualizacion = data.fecha_actualizacion.toDate().toISOString();
      }
      return data;
    }).sort((a, b) => a.nombre_membresia.localeCompare(b.nombre_membresia));

    res.json({
      success: true,
      data: { membresias, total: membresias.length },
      message: `Se encontraron ${membresias.length} membresías disponibles`
    });
  } catch (error) {
    console.error('[Get Available Memberships Error]', error.message, error.stack);
    res.status(500).json({
      success: false,
      error: 'Error al obtener membresías disponibles',
      code: 'GET_AVAILABLE_MEMBERSHIPS_ERROR'
    });
  }
};