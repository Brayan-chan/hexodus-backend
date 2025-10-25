import supabase from "../config/supabase-config";

export const authTwo = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email y password son requeridos",
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({
        success: false,
        message: "Error de autenticación",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Usuario autenticado exitosamente",
      data,
    });
  } catch (error) {
    console.error("Error en authTwo:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};