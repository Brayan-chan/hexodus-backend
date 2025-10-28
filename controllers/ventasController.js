import supabase from '../config/supabase-config.js';

export const getVentas = (req, res) => {
  res.json({
    message: "Devolviendo listado de ventas", ventas: [
      { id: 1, producto: "Producto 1", cantidad: 10, precio: 100 },
      { id: 2, producto: "Producto 2", cantidad: 5, precio: 200 },
      { id: 3, producto: "Producto 3", cantidad: 8, precio: 150 }
    ]
  });
};

export const createVenta = async (req, res) => {
  try {
    const { producto, cantidad, precio } = req.body;

    // Validar que todos los campos requeridos estén presentes
    if (!producto || !cantidad || !precio) {
      return res.status(400).json({
        success: false,
        message: 'Producto, cantidad y precio son requeridos'
      });
    }

    // Validar que cantidad y precio sean números positivos
    if (cantidad <= 0 || precio <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Cantidad y precio deben ser mayores a 0'
      });
    }

    // Obtener el token del header de autorización
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de autorización no proporcionado'
      });
    }

    const token = authHeader.split(' ')[1];
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: userError?.message
      });
    }

    const userId = userData.user.id;
    console.log('Usuario autenticado:', userId);

    // Intentar insertar la venta
    const { data, error } = await supabase
      .from('ventas')
      .insert([{
        producto,
        cantidad,
        precio,
        fecha_venta: new Date().toISOString(),
        user_id: userId
      }])
      .select();

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Error al registrar venta',
        error: error.message
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Venta registrada exitosamente',
      data
    });

  } catch (error) {
    console.error('Error en createVenta:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};