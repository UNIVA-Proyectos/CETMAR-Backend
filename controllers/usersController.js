const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const keys = require("../config/keys");

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
      const user = req.body;
      const data = await User.create(user);

      await rol.create(data.id, 1); //Rol por defecto CLIENTE

      return res.status(201).json({
        success: true,
        message: "El registro se realizo correctamente",
        data: data.id,
      });
    } catch (error) {
      console.log(`Error: ${error}`);
      return res.status(501).json({
        success: false,
        message: "Error al registrar usuario",
        error: error,
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
          role: user.tipo_usuario, // Agregar rol para autorización
        },
        keys.secretOrKey,
        { expiresIn: "1h" } // Expira en 1 hora
      );

      // Datos del usuario que se enviarán al frontend
      const data = {
        id: user.id,
        name: user.nombres,
        lastname: user.apellido_paterno,
        matricula: user.matricula,
        phone: user.telefono,
        role: user.tipo_usuario, // Tipo de usuario
      };

      return res.status(200).json({
        success: true,
        message: "El usuario se ha logueado correctamente",
        data,
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
};
