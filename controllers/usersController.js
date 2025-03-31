const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const keys = require("../config/keys");
const db = require("../config/config");

module.exports = {
  async getAll(req, res, next) {
    try {
      const data = await User.getAll();
      console.log(`Usuarios: ${data}`);
      return res.status(200).json(data);
    } catch (error) {
      console.log(`Error: ${error}`);
      return res.status(501).json({
        success: false,
        message: "Error al obtener los usuarios",
      });
    }
  },

  async findById(req, res, next) {
    try {
      const id = req.params.id;
      const data = await User.findByUserId(id);
      console.log(`Usuario: ${data}`);
      return res.status(200).json(data);
    } catch (error) {
      console.log(`Error: ${error}`);
      return res.status(501).json({
        success: false,
        message: "Error al obtener al usuario",
      });
    }
  },

  async register(req, res, next) {
    try {
      const {
        matricula,
        nombre,
        apellido_paterno,
        apellido_materno,
        correo,
        contraseña,
        tipo_usuario,
        telefono,
      } = req.body;

      // Validar datos requeridos
      if (
        !matricula ||
        !nombre ||
        !apellido_paterno ||
        !apellido_materno ||
        !correo ||
        !contraseña ||
        !tipo_usuario
      ) {
        return res.status(400).json({
          success: false,
          message: "Todos los campos son requeridos",
        });
      }

      // Hash de la contraseña
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(contraseña, salt);

      const user = {
        matricula,
        nombre,
        apellido_paterno,
        apellido_materno,
        correo,
        contraseña: hash,
        tipo_usuario,
        telefono,
      };

      const data = await User.create(user);

      return res.status(201).json({
        success: true,
        message: "El registro se realizó correctamente",
        data: data,
      });
    } catch (error) {
      console.log(`Error: ${error}`);
      return res.status(501).json({
        success: false,
        message: "Error al registrar el usuario",
        error: error.message,
      });
    }
  },

  async update(req, res, next) {
    try {
      const user = req.body;
      await User.update(user);
      return res.status(200).json({
        success: true,
        message: "Los datos fueron actualizados correctamente",
      });
    } catch (error) {
      console.log(`Error: ${error}`);
      return res.status(501).json({
        success: false,
        message: "Error al actualizar el usuario",
      });
    }
  },

  async login(req, res) {
    try {
      const { matricula, contraseña } = req.body;

      // Buscar usuario en la base de datos
      const user = await User.findByMatricula(matricula);
      console.log('DEBUG - Usuario encontrado:', user);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "La matricula no existe",
        });
      }

      // Comparar contraseñas usando bcrypt
      const isMatch = await bcrypt.compare(contraseña, user.contraseña);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "La contraseña no es correcta",
        });
      }

      // Generar token JWT
      const token = jwt.sign(
        {
          id: user.id,
          matricula: user.matricula,
          tipo_usuario: user.tipo_usuario,
        },
        keys.secretOrKey,
        { expiresIn: "1h" } // Expira en 1 hora
      );

      console.log('DEBUG - Token generado:', jwt.decode(token));

      // Datos del usuario que se enviarán al frontend
      const data = {
        id: user.id,
        nombre: user.nombre,
        apellido_paterno: user.apellido_paterno,
        apellido_materno: user.apellido_materno,
        matricula: user.matricula,
        telefono: user.telefono,
        tipo_usuario: user.tipo_usuario,
      };

      console.log('DEBUG - Datos a enviar:', data);

      return res.status(200).json({
        success: true,
        message: "El usuario se ha logueado correctamente",
        data,
        token,
      });
    } catch (error) {
      console.error(`Error: ${error}`);
      return res.status(500).json({
        success: false,
        message: "Error al iniciar sesión",
        error: error.message,
      });
    }
  },

  async verifySession(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      console.log('DEBUG - Token recibido:', token);
      
      if (!token) {
        console.log('DEBUG - No se proporcionó token');
        return res.status(401).json({
          success: false,
          message: "No se proporcionó token de autenticación"
        });
      }

      const decoded = jwt.verify(token, keys.secretOrKey);
      console.log('DEBUG - Token decodificado:', decoded);
      
      const user = await User.findByMatricula(decoded.matricula);
      console.log('DEBUG - Usuario encontrado:', user ? 'Sí' : 'No');

      if (!user) {
        console.log('DEBUG - Usuario no encontrado');
        return res.status(401).json({
          success: false,
          message: "Usuario no encontrado"
        });
      }

      const data = {
        id: user.id,
        nombre: user.nombre,
        apellido_paterno: user.apellido_paterno,
        apellido_materno: user.apellido_materno,
        matricula: user.matricula,
        telefono: user.telefono,
        tipo_usuario: user.tipo_usuario
      };

      console.log('DEBUG - Enviando respuesta exitosa');
      return res.status(200).json({
        success: true,
        message: "Sesión válida",
        data
      });
    } catch (error) {
      console.error('DEBUG - Error en verifySession:', error.message);
      return res.status(401).json({
        success: false,
        message: "Sesión inválida",
        error: error.message
      });
    }
  },

  async logout(req, res, next) {
    try {
      return res.status(200).json({
        success: true,
        message: "La sesión se ha cerrado correctamente",
      });
    } catch (error) {
      console.log(`Error: ${error}`);
      return res.status(501).json({
        success: false,
        message: "Error al cerrar la sesión",
      });
    }
  },

  async getProfile(req, res) {
    try {
      const id = req.params.id;
      const role = req.params.role;

      const data = await User.getProfileByRole(id, role);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.log(`Error: ${error}`);
      return res.status(501).json({
        success: false,
        message: "Error al obtener el perfil",
        error: error.message,
      });
    }
  },
};
