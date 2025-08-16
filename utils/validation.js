const Joi = require('joi');

// Esquemas de validación para usuarios
const userValidationSchemas = {
  create: Joi.object({
    matricula: Joi.string().required().min(5).max(20),
    nombre: Joi.string().required().min(2).max(100).trim(),
    apellido_paterno: Joi.string().required().min(2).max(100).trim(),
    apellido_materno: Joi.string().required().min(2).max(100).trim(),
    correo: Joi.string().email().required(),
    contraseña: Joi.string().min(6).required(),
    telefono: Joi.string().optional().allow('').pattern(/^[0-9]{10}$/),
    roles: Joi.array().items(Joi.string().valid('admin', 'profesor', 'estudiante', 'padre')).min(1).required()
  }),

  update: Joi.object({
    id: Joi.number().integer().positive().required(),
    nombre: Joi.string().required().min(2).max(100).trim(),
    apellido_paterno: Joi.string().required().min(2).max(100).trim(),
    apellido_materno: Joi.string().required().min(2).max(100).trim(),
    correo: Joi.string().email().required(),
    telefono: Joi.string().optional().allow('').pattern(/^[0-9]{10}$/),
    roles: Joi.array().items(Joi.string().valid('admin', 'profesor', 'estudiante', 'padre')).min(1).required()
  })
};

// Middleware de validación
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

module.exports = {
  userValidationSchemas,
  validateRequest
};
