import supabase from '../config/supabase-config.js';

export const signUp = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y password son requeridos'
            });
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) {
            return res.status(500).json({
                success: false,
                message: 'Error al registrar usuario',
                error: error.message
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data
        });
    } catch (error) {
        console.error('Error en signUp:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

export const signIn = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y password son requeridos'
            });
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas',
                error: error.message
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso',
            data
        });
    } catch (error) {
        console.error('Error en signIn:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

export const signOut = async (req, res) => {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            return res.status(500).json({
                success: false,
                message: 'Error al cerrar sesión',
                error: error.message
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Sesión cerrada exitosamente'
        });
    } catch (error) {
        console.error('Error en signOut:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

export const getUser = async (req, res) => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
            return res.status(401).json({
                success: false,
                message: 'No hay sesión activa',
                error: error.message
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Usuario recuperado exitosamente',
            user
        });
    } catch (error) {
        console.error('Error en getUser:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};