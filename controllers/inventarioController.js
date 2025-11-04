import supabase from "../config/supabase-config.js";

export const createProduct = async (req, res) => {
    try {
        // La duración es opcional
        const { nombre, stock, precio, tipo, proveedor, duración } = req.body;

        // Validar que todos los campos requeridos esten presentes
        if (!nombre || !stock || !precio || !tipo || !proveedor) {
            return res.status(400).json({
                success: false,
                message: 'Nombre, stock, precio, tipo, proveedor son requeridos'
            });
        }

        // Validar que el stock y precio sean numeros positivos
        if (stock <= 0 || precio <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Stock y precio deben ser mayores a 0'
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

        // Intentar insertar el producto
        const { data, error } = await supabase
            .from('inventario')
            .insert([{
                nombre,
                stock,
                precio,
                tipo,
                proveedor,
                duración,
                fecha_creacion: new Date().toISOString(),
                user_id: userId
            }])
            .select();

        if (error) {
            return res.status(500).json({
                success: false,
                message: 'Error al crear el producto',
                error: error.message
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Producto registrado exitosamente',
            data
        });
    } catch (error) {
        console.error('Error en createProductService:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};