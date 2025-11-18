export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Validación fallida',
        details: error.errors,
        code: 'VALIDATION_ERROR'
      });
    }
  };
};