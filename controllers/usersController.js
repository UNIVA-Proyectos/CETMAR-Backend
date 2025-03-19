const User = require("../models/user");
const jwt = require("jsonwebtoken");
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

  async login(req, res, next) {
    try {
      const email = req.body.email;
      const password = req.body.password;
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "El email no existe",
        });
      }
      if (User.isPasswordMatch(password, user.password)) {
        const token = jwt.sign(
          {
            id: user.id,
            email: user.email,
          },
          keys.secretOrKey,
          {
            expiresIn: 60 * 60 * 24, //1hora
          }
        );
        const data = {
          id: user.id,
          name: user.name,
          email: user.email,
          lastname: user.lastname,
          image: user.image,
          phone: user.phone,
          session_token: `JWT ${token}`,
          roles: user.roles,
        };

        await User.updateToken(user.id, `JWT ${token}`);

        return res.status(201).json({
          success: true,
          message: "El usuario se ha logueado correctamente",
          data: data,
        });
      } else {
        return res.status(401).json({
          success: false,
          message: "La contraseña no es correcta",
        });
      }
    } catch (error) {
      console.log(`Error: ${error}`);
      return res.status(501).json({
        success: false,
        message: "Error al iniciar sesión",
        error: error,
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
