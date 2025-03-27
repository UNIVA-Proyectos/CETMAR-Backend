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
        !correo ||
        !contraseña ||
        !tipo_usuario
      ) {
        return res.status(400).json({
          success: false,
          message: "Todos los campos requeridos deben ser proporcionados.",
        });
      }

      // Verificar si el usuario ya existe
      const existingUser = await db.oneOrNone(
        "SELECT id FROM usuarios WHERE matricula = $1 OR correo = $2",
        [matricula, correo]
      );

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "El usuario con esta matrícula o correo ya está registrado.",
        });
      }

      // Crear el usuario
      const newUser = await User.create({
        matricula,
        nombre,
        apellido_paterno,
        apellido_materno,
        correo,
        contraseña,
        tipo_usuario,
        telefono,
      });

      return res.status(201).json({
        success: true,
        message: "El registro se realizó correctamente",
        data: newUser.id,
      });
    } catch (error) {
      console.error(`Error en registro: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: "Error al registrar usuario",
        error: error.message,
      });
    }
  },

  async update(req, res, next) {
    try {
      const user = JSON.parse(req.body.user);
      console.log(`Datos enviados del usuario: ${JSON.stringify(user)}`);
      const files = req.files;
      if (files.length > 0) {
        const pathImage = `image_${Date.now()}`; //NOMBRE DEL ARVHIVO A ALMACENAR
        const url = await storage(files[0], pathImage);

        if (url != undefined && url != null) {
          user.image = url;
        }
      }

      await User.update(user);

      return res.status(201).json({
        success: true,
        message: "Los datos del usuario han sido actualizados correctamente",
      });
    } catch (error) {
      console.log(`Error: ${error}`);
      return res.status(501).json({
        success: false,
        message: "Error al actualizar los datos del usuario",
        error: error,
      });
    }
  },

  async login(req, res) {
    try {
      const { matricula, contraseña } = req.body;

      // Buscar usuario en la base de datos
      const user = await User.findByMatricula(matricula);
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
          role: user.role,
        },
        keys.secretOrKey,
        { expiresIn: "1h" } // Expira en 1 hora
      );

      // Datos del usuario que se enviarán al frontend
      const dataUser = {
        id: user.id,
        nombre: user.nombre,
        apellido_paterno: user.apellido_paterno,
        apellido_materno: user.apellido_materno,
        matricula: user.matricula,
        telefono: user.telefono,
        rol: user.role, // Tipo de usuario
      };

      return res.status(200).json({
        success: true,
        message: "El usuario se ha logueado correctamente",
        dataUser,
        token, // Enviar el token como respuesta
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

  async logout(req, res, next) {
    try {
      const id = req.body.id;
      await User.updateToken(id, null);
      return res.status(201).json({
        success: true,
        message: "Se ha cerrado la sesion correctamente",
      });
    } catch (e) {
      console.log(`Error: ${error}`);
      return res.status(501).json({
        success: false,
        message: "Error al cerrar sesion",
        error: error,
      });
    }
  },

  async getProfile(req, res) {
    try {
      const { id, role } = req.user; // Datos del token

      // Obtener perfil según el rol
      const profileData = await User.getProfileByRole(id, role);
      if (!profileData) {
        return res.status(404).json({
          success: false,
          message: "Perfil no encontrado",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Perfil obtenido correctamente",
        data: profileData,
      });
    } catch (error) {
      console.error(`Error: ${error}`);
      return res.status(500).json({
        success: false,
        message: "Error al obtener el perfil",
        error: error.message,
      });
    }
  },
};
