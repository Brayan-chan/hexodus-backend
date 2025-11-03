import supabase from '../config/supabase-config.js';

export const getSocios = (req, res) => {
  res.json({ message: "Devolviendo listado de socios", socios: [
    { id: 1, nombre: "Socio 1", apellidos: "Apellidos 1", statusMembership: "activo"},
    { id: 2, nombre: "Socio 2", apellidos: "Apellidos 2", statusMembership: "inactivo"},
    { id: 3, nombre: "Socio 3", apellidos: "Apellidos 3", statusMembership: "activo"}
  ]});
};

export const createSocio = async ( req, res ) => {
  try {
    const { nombre, apellidos, status_membership } = req.body;

    // Validar que todos los campos requeridos estén presentes
    if (!nombre || !apellidos || !status_membership) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, apellidos y status_membership son requeridos'
      });
    }

    // Validar que el status sea válido
    if (!['activo', 'inactivo'].includes(status_membership)) {
      return res.status(400).json({
        success: false,
        message: 'El status debe ser "activo" o "inactivo"'
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

    // Crear un nuevo cliente de Supabase con el token
    const supabaseClient = supabase;
    supabaseClient.auth.setSession({
      access_token: token,
      refresh_token: null
    });

    // Decodificar el token JWT para obtener el user_id
    const tokenParts = token.split('.');
    const tokenPayload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    const userId = tokenPayload.sub; // El sub contiene el user_id en los tokens de Supabase

    // Configurar el token en los headers del cliente
    supabaseClient.rest.headers = {
      ...supabaseClient.rest.headers,
      'Authorization': `Bearer ${token}`
    };

    /*
    * Depuraciónn para mostrar el ID del usuario autenticado
    * en la consola del servidor
    */
    console.log('Usuario autenticado:', userId);

    // Intentar insertar el socio
    const { data, error } = await supabase
      .from('socios')
      .insert([{
        nombre,
        apellidos,
        status_membership,
        fecha_creacion: new Date().toISOString(),
        user_id: userId
      }])
      .select();

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Error al crear socio',
        error: error.message
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Socio creado exitosamente',
      data
    });

  } catch (error) {
    console.error('Error en createSocio:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};