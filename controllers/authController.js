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
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase-config.js';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'hexodus-secret-key-2024';

// Esquemas de validación
const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  nombre: z.string().min(2, 'Nombre requerido'),
  telefono: z.string().min(10, 'Teléfono debe tener al menos 10 dígitos'),
  rol: z.enum(['admin', 'vendedor']).default('vendedor')
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida')
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

// 5. GET - Obtener todos los usuarios (solo para admins)
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

    const { limit = 50, status } = req.query;

    let usersQuery = collection(db, 'usuarios');
    
    if (status) {
      usersQuery = query(usersQuery, where('status', '==', status));
    }

    const querySnapshot = await getDocs(usersQuery);
    const users = [];
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        email: userData.email,
        nombre: userData.nombre,
        telefono: userData.telefono,
        rol: userData.rol,
        status: userData.status,
        fecha_creacion: userData.fecha_creacion,
        ultimo_acceso: userData.ultimo_acceso
      });
    });

    res.json({
      success: true,
      data: {
        users: users.slice(0, parseInt(limit)),
        total: users.length
      }
    });

  } catch (error) {
    console.error('[Get Users Error]', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener usuarios',
      code: 'GET_USERS_ERROR'
    });
  }
};

