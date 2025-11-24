import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  startAfter,
  or
} from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { auth, db } from '../config/firebase-config.js';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'hexodus-secret-key-2024';

// Esquemas de validación
const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  nombre: z.string().min(2, 'Nombre requerido'),
  telefono: z.string().default('sin telefono').transform((val) => {
    // Si está vacío o es undefined, usar "sin telefono"
    if (!val || val.trim() === '') {
      return 'sin telefono';
    }
    // Si ya es "sin telefono", mantenerlo
    if (val === 'sin telefono') {
      return val;
    }
    // Si tiene contenido, validar que sean 10 dígitos
    if (!/^\d{10}$/.test(val)) {
      throw new Error('El teléfono debe tener exactamente 10 dígitos numéricos');
    }
    return val;
  }),
  rol: z.enum(['admin', 'vendedor']).default('vendedor')
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida')
});

const updateUserSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido').optional(),
  telefono: z.string().optional().transform((val) => {
    // Si es undefined o no se envía, mantener el valor actual
    if (val === undefined) {
      return undefined;
    }
    // Si está vacío, usar "sin telefono"
    if (!val || val.trim() === '') {
      return 'sin telefono';
    }
    // Si ya es "sin telefono", mantenerlo
    if (val === 'sin telefono') {
      return val;
    }
    // Si tiene contenido, validar que sean 10 dígitos
    if (!/^\d{10}$/.test(val)) {
      throw new Error('El teléfono debe tener exactamente 10 dígitos numéricos');
    }
    return val;
  }),
  rol: z.enum(['admin', 'vendedor']).optional(),
  status: z.enum(['activo', 'inactivo']).optional()
});

// Helper function para crear JWT token
const createJWTToken = (user) => {
  return jwt.sign(
    { 
      id: user.uid, 
      email: user.email, 
      nombre: user.nombre,
      rol: user.rol 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// 1. POST - Registrar nuevo usuario
export const register = async (req, res) => {
  try {
    console.log('[Register] Request body:', req.body);
    
    const data = registerSchema.parse(req.body);
    const { email, password, nombre, telefono, rol } = data;

    // Verificar si el usuario ya existe en Firestore
    const usersRef = collection(db, 'usuarios');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return res.status(400).json({
        success: false,
        error: 'El usuario ya existe',
        code: 'USER_ALREADY_EXISTS'
      });
    }

    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Crear documento de usuario en Firestore
    const userData = {
      uid: firebaseUser.uid,
      email: email,
      nombre: nombre,
      telefono: telefono,
      rol: rol,
      status: 'activo',
      fecha_creacion: serverTimestamp(),
      ultimo_acceso: serverTimestamp()
    };

    await setDoc(doc(db, 'usuarios', firebaseUser.uid), userData);

    // Crear JWT token
    const token = createJWTToken({
      uid: firebaseUser.uid,
      email: email,
      nombre: nombre,
      rol: rol
    });

    console.log('[Register] Usuario creado exitosamente:', firebaseUser.uid);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: firebaseUser.uid,
          email: email,
          nombre: nombre,
          telefono: telefono,
          rol: rol,
          status: 'activo'
        },
        token: token
      },
      message: 'Usuario registrado exitosamente'
    });

  } catch (error) {
    console.error('[Register Error]', error);
    
    // Manejar errores específicos de Firebase
    if (error.code === 'auth/email-already-in-use') {
      return res.status(400).json({
        success: false,
        error: 'El email ya está en uso',
        code: 'EMAIL_ALREADY_IN_USE'
      });
    }
    
    if (error.code === 'auth/weak-password') {
      return res.status(400).json({
        success: false,
        error: 'La contraseña es muy débil',
        code: 'WEAK_PASSWORD'
      });
    }

    res.status(400).json({
      success: false,
      error: error.message || 'Error al registrar usuario',
      code: 'REGISTER_ERROR'
    });
  }
};

// 2. POST - Login de usuario
export const login = async (req, res) => {
  try {
    console.log('[Login] Request body:', req.body);
    
    const data = loginSchema.parse(req.body);
    const { email, password } = data;

    // Autenticar con Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Obtener datos adicionales del usuario desde Firestore
    const userDoc = await getDoc(doc(db, 'usuarios', firebaseUser.uid));
    
    if (!userDoc.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado en la base de datos',
        code: 'USER_NOT_FOUND'
      });
    }

    const userData = userDoc.data();

    // Verificar que el usuario esté activo
    if (userData.status !== 'activo') {
      return res.status(403).json({
        success: false,
        error: 'Usuario inactivo',
        code: 'USER_INACTIVE'
      });
    }

    // Actualizar último acceso
    await setDoc(doc(db, 'usuarios', firebaseUser.uid), {
      ultimo_acceso: serverTimestamp()
    }, { merge: true });

    // Crear JWT token
    const token = createJWTToken({
      uid: firebaseUser.uid,
      email: userData.email,
      nombre: userData.nombre,
      rol: userData.rol
    });

    console.log('[Login] Login exitoso:', firebaseUser.uid);

    res.json({
      success: true,
      data: {
        user: {
          id: firebaseUser.uid,
          email: userData.email,
          nombre: userData.nombre,
          telefono: userData.telefono,
          rol: userData.rol,
          status: userData.status
        },
        token: token
      },
      message: 'Login exitoso'
    });

  } catch (error) {
    console.error('[Login Error]', error);
    
    // Manejar errores específicos de Firebase
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      return res.status(401).json({
        success: false,
        error: 'Email o contraseña incorrectos',
        code: 'INVALID_CREDENTIALS'
      });
    }

    if (error.code === 'auth/too-many-requests') {
      return res.status(429).json({
        success: false,
        error: 'Demasiados intentos fallidos. Intenta más tarde',
        code: 'TOO_MANY_REQUESTS'
      });
    }

    res.status(400).json({
      success: false,
      error: error.message || 'Error en el login',
      code: 'LOGIN_ERROR'
    });
  }
};

// 3. POST - Logout
export const logout = async (req, res) => {
  try {
    // En Firebase, el logout se maneja principalmente en el frontend
    // Aquí podríamos invalidar el token JWT si implementáramos una blacklist
    
    res.json({
      success: true,
      message: 'Logout exitoso'
    });
    
  } catch (error) {
    console.error('[Logout Error]', error);
    res.status(500).json({
      success: false,
      error: 'Error al cerrar sesión',
      code: 'LOGOUT_ERROR'
    });
  }
};

// 4. GET - Obtener usuario actual
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Obtener datos del usuario desde Firestore
    const userDoc = await getDoc(doc(db, 'usuarios', userId));
    
    if (!userDoc.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    const userData = userDoc.data();

    res.json({
      success: true,
      data: {
        user: {
          id: userDoc.id,
          email: userData.email,
          nombre: userData.nombre,
          telefono: userData.telefono,
          rol: userData.rol,
          status: userData.status,
          fecha_creacion: userData.fecha_creacion,
          ultimo_acceso: userData.ultimo_acceso
        }
      }
    });

  } catch (error) {
    console.error('[Get Current User Error]', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener usuario actual',
      code: 'GET_USER_ERROR'
    });
  }
};

// 5. GET - Obtener todos los usuarios con búsqueda, filtrado y paginación (solo para admins)
export const getUsers = async (req, res) => {
  try {
    // Verificar que el usuario sea admin
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para ver usuarios',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const { 
      page = 1, 
      limit = 10, 
      status, 
      rol, 
      search,
      sortBy = 'fecha_creacion',
      sortOrder = 'desc'
    } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const offset = (pageNumber - 1) * limitNumber;

    console.log('[Get Users] Filtros recibidos:', { status, rol, search, sortBy, sortOrder });

    // Construir query con filtros de manera más simple
    let usersQuery = collection(db, 'usuarios');
    
    // Si hay filtros específicos, aplicarlos uno a la vez
    if (status && !rol) {
      // Solo filtrar por status
      usersQuery = query(usersQuery, where('status', '==', status));
    } else if (rol && !status) {
      // Solo filtrar por rol
      usersQuery = query(usersQuery, where('rol', '==', rol));
    } else if (status && rol) {
      // Filtrar por ambos
      usersQuery = query(
        usersQuery, 
        where('status', '==', status),
        where('rol', '==', rol)
      );
    }

    // Ejecutar query
    const querySnapshot = await getDocs(usersQuery);
    let users = [];
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      users.push({
        uid: doc.id,
        email: userData.email,
        nombre: userData.nombre,
        telefono: userData.telefono,
        rol: userData.rol,
        status: userData.status,
        fecha_creacion: userData.fecha_creacion,
        ultimo_acceso: userData.ultimo_acceso
      });
    });

    console.log(`[Get Users] Usuarios obtenidos de Firestore: ${users.length}`);

    // Búsqueda local (ya que Firestore no soporta búsqueda de texto completo nativa)
    if (search) {
      const searchTerm = search.toLowerCase();
      users = users.filter(user => 
        user.nombre.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.telefono.includes(searchTerm)
      );
      console.log(`[Get Users] Usuarios después de búsqueda: ${users.length}`);
    }

    // Ordenamiento local
    users.sort((a, b) => {
      let valueA, valueB;
      
      switch (sortBy) {
        case 'nombre':
          valueA = a.nombre.toLowerCase();
          valueB = b.nombre.toLowerCase();
          break;
        case 'email':
          valueA = a.email.toLowerCase();
          valueB = b.email.toLowerCase();
          break;
        case 'fecha_creacion':
        default:
          // Para timestamps de Firestore, usar seconds para comparar
          valueA = a.fecha_creacion?.seconds || 0;
          valueB = b.fecha_creacion?.seconds || 0;
          break;
      }

      if (sortOrder === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

    // Paginación
    const total = users.length;
    const totalPages = Math.ceil(total / limitNumber);
    const paginatedUsers = users.slice(offset, offset + limitNumber);

    console.log(`[Get Users] Paginación: página ${pageNumber}, total ${total}, páginas ${totalPages}`);

    res.json({
      success: true,
      data: {
        users: paginatedUsers,
        pagination: {
          current_page: pageNumber,
          per_page: limitNumber,
          total: total,
          total_pages: totalPages,
          has_next_page: pageNumber < totalPages,
          has_prev_page: pageNumber > 1
        },
        filters: {
          status,
          rol,
          search,
          sortBy,
          sortOrder
        }
      },
      message: `Se encontraron ${total} usuarios`
    });

  } catch (error) {
    console.error('[Get Users Error]', error);
    console.error('[Get Users Error Stack]', error.stack);
    res.status(500).json({
      success: false,
      error: 'Error al obtener usuarios',
      details: error.message,
      code: 'GET_USERS_ERROR'
    });
  }
};

// 6. GET - Obtener usuario por ID (solo para admins)
export const getUserById = async (req, res) => {
  try {
    // Verificar que el usuario sea admin o que esté consultando su propio perfil
    const { userId } = req.params;
    if (req.user.rol !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para ver este usuario',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const userDoc = await getDoc(doc(db, 'usuarios', userId));
    
    if (!userDoc.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    const userData = userDoc.data();

    res.json({
      success: true,
      data: {
        user: {
          uid: userDoc.id,
          email: userData.email,
          nombre: userData.nombre,
          telefono: userData.telefono,
          rol: userData.rol,
          status: userData.status,
          fecha_creacion: userData.fecha_creacion,
          ultimo_acceso: userData.ultimo_acceso
        }
      },
      message: 'Usuario obtenido correctamente'
    });

  } catch (error) {
    console.error('[Get User By ID Error]', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener usuario',
      code: 'GET_USER_ERROR'
    });
  }
};

// 7. PUT - Actualizar usuario (solo para admins o el propio usuario)
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verificar permisos: admin puede editar cualquier usuario, otros solo su propio perfil
    if (req.user.rol !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para editar este usuario',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Validar datos de entrada
    const validatedData = updateUserSchema.parse(req.body);
    
    // Solo admins pueden cambiar rol y status
    if (req.user.rol !== 'admin') {
      delete validatedData.rol;
      delete validatedData.status;
    }

    // Verificar que el usuario existe
    const userDoc = await getDoc(doc(db, 'usuarios', userId));
    if (!userDoc.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    // Preparar datos para actualizar
    const updateData = {
      ...validatedData,
      fecha_actualizacion: serverTimestamp()
    };

    // Actualizar usuario en Firestore
    await updateDoc(doc(db, 'usuarios', userId), updateData);

    // Obtener datos actualizados
    const updatedUserDoc = await getDoc(doc(db, 'usuarios', userId));
    const updatedUserData = updatedUserDoc.data();

    res.json({
      success: true,
      data: {
        user: {
          uid: updatedUserDoc.id,
          email: updatedUserData.email,
          nombre: updatedUserData.nombre,
          telefono: updatedUserData.telefono,
          rol: updatedUserData.rol,
          status: updatedUserData.status,
          fecha_creacion: updatedUserData.fecha_creacion,
          fecha_actualizacion: updatedUserData.fecha_actualizacion
        }
      },
      message: 'Usuario actualizado correctamente'
    });

  } catch (error) {
    console.error('[Update User Error]', error);
    
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
      error: 'Error al actualizar usuario',
      code: 'UPDATE_USER_ERROR'
    });
  }
};

// 8. DELETE - Eliminar usuario (solo para admins)
export const deleteUserById = async (req, res) => {
  try {
    // Solo admins pueden eliminar usuarios
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para eliminar usuarios',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const { userId } = req.params;

    // Verificar que el usuario no se esté eliminando a sí mismo
    if (req.user.id === userId) {
      return res.status(400).json({
        success: false,
        error: 'No puedes eliminar tu propio usuario',
        code: 'CANNOT_DELETE_SELF'
      });
    }

    // Verificar que el usuario existe en Firestore
    const userDoc = await getDoc(doc(db, 'usuarios', userId));
    if (!userDoc.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    const userData = userDoc.data();

    try {
      // Eliminar usuario de Firestore primero
      await deleteDoc(doc(db, 'usuarios', userId));
      
      // Nota: Para eliminar de Firebase Auth necesitaríamos el Admin SDK
      // Por ahora solo eliminamos de Firestore y marcamos como eliminado
      console.log(`[Delete User] Usuario ${userId} eliminado de Firestore`);
      
      res.json({
        success: true,
        data: {
          deleted_user: {
            uid: userId,
            email: userData.email,
            nombre: userData.nombre
          }
        },
        message: 'Usuario eliminado correctamente'
      });

    } catch (deleteError) {
      console.error('[Delete User Firebase Error]', deleteError);
      
      // Si falla la eliminación, intentar marcar como inactivo
      await updateDoc(doc(db, 'usuarios', userId), {
        status: 'eliminado',
        fecha_eliminacion: serverTimestamp()
      });
      
      res.json({
        success: true,
        data: {
          deleted_user: {
            uid: userId,
            email: userData.email,
            nombre: userData.nombre
          }
        },
        message: 'Usuario marcado como eliminado'
      });
    }

  } catch (error) {
    console.error('[Delete User Error]', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar usuario',
      code: 'DELETE_USER_ERROR'
    });
  }
};

// 9. POST - Activar/Desactivar usuario (solo para admins)
export const toggleUserStatus = async (req, res) => {
  try {
    // Solo admins pueden cambiar el status de usuarios
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para cambiar el status de usuarios',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const { userId } = req.params;
    const { status } = req.body;

    // Validar status
    if (!['activo', 'inactivo'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status debe ser "activo" o "inactivo"',
        code: 'INVALID_STATUS'
      });
    }

    // Verificar que el usuario no se esté desactivando a sí mismo
    if (req.user.id === userId && status === 'inactivo') {
      return res.status(400).json({
        success: false,
        error: 'No puedes desactivar tu propio usuario',
        code: 'CANNOT_DEACTIVATE_SELF'
      });
    }

    // Verificar que el usuario existe
    const userDoc = await getDoc(doc(db, 'usuarios', userId));
    if (!userDoc.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    // Actualizar status
    await updateDoc(doc(db, 'usuarios', userId), {
      status: status,
      fecha_actualizacion: serverTimestamp()
    });

    const userData = userDoc.data();

    res.json({
      success: true,
      data: {
        user: {
          uid: userId,
          email: userData.email,
          nombre: userData.nombre,
          status: status
        }
      },
      message: `Usuario ${status === 'activo' ? 'activado' : 'desactivado'} correctamente`
    });

  } catch (error) {
    console.error('[Toggle User Status Error]', error);
    res.status(500).json({
      success: false,
      error: 'Error al cambiar status del usuario',
      code: 'TOGGLE_STATUS_ERROR'
    });
  }
};

