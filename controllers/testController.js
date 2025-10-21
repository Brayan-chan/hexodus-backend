import supabase from '../config/supabase-config.js';

export const testConnection = async (req, res) => {
  try {
    // Intentar una operación simple, como obtener la hora actual de la base de datos
    // Probamos la conexión usando un método más simple
    const { data, error } = await supabase
      .from('users')  // Reemplaza 'users' con el nombre de una tabla que exista en tu base de datos
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error de conexión:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al conectar con Supabase',
        error: error.message
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Conexión exitosa con Supabase',
      data
    });
  } catch (error) {
    console.error('Error inesperado:', error);
    return res.status(500).json({
      success: false,
      message: 'Error inesperado al conectar con Supabase',
      error: error.message
    });
  }
};