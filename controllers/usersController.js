const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

module.exports = {
  async getAll(req, res) {
    try {
      const users = await User.getAll();
      return res.status(200).json(users);
    } catch (error) {
      console.error("Error en getAll:", error);
      return res.status(500).json({
        success: false,
        message: "Error al obtener los usuarios",
      });
    }
  },

  async findById(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findByUserId(id);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "Usuario no encontrado" });
      }

      return res.status(200).json(user);
    } catch (error) {
      console.error("Error en findById:", error);
      return res.status(500).json({
        success: false,
        message: "Error al obtener al usuario",
      });
    }
  },

  async register(req, res) {
    try {
      const {
        matricula,
        nombre,
        apellido_paterno,
        apellido_materno,
        correo,
        contraseña,
        telefono,
        roles,
      } = req.body;

      if (
        !matricula ||
        !nombre ||
        !apellido_paterno ||
        !apellido_materno ||
        !correo ||
        !contraseña ||
        !roles ||
        roles.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Todos los campos son requeridos, incluyendo roles",
        });
      }

      const user = {
        matricula,
        nombre,
        apellido_paterno,
        apellido_materno,
        correo,
        contraseña,
        telefono,
      };

      // Registrar usuario y asignar roles
      const newUser = await User.create(user, roles);

      return res.status(201).json({
        success: true,
        message: "Usuario registrado correctamente",
        data: newUser,
      });
    } catch (error) {
      console.error("Error en register:", error);
      return res.status(500).json({
        success: false,
        message: "Error al registrar el usuario",
      });
    }
  },

  async update(req, res) {
    try {
      const {
        id,
        nombre,
        apellido_paterno,
        apellido_materno,
        correo,
        telefono,
        roles,
      } = req.body;

      if (
        !id ||
        !nombre ||
        !apellido_paterno ||
        !apellido_materno ||
        !correo ||
        !roles ||
        roles.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Faltan datos obligatorios o roles",
        });
      }

      await User.update({
        id,
        nombre,
        apellido_paterno,
        apellido_materno,
        correo,
        telefono,
        roles,
      });
      return res
        .status(200)
        .json({ success: true, message: "Usuario actualizado correctamente" });
    } catch (error) {
      console.error("Error en update:", error);
      return res.status(500).json({
        success: false,
        message: "Error al actualizar el usuario",
      });
    }
  },

  async login(req, res) {
    try {
      const { matricula, contraseña } = req.body;
      const user = await User.findByMatricula(matricula);

      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "La matrícula no existe" });
      }

      const isMatch = await bcrypt.compare(contraseña, user.contraseña);
      if (!isMatch) {
        return res
          .status(401)
          .json({ success: false, message: "La contraseña no es correcta" });
      }

      const roles = await User.getRolesByUserId(user.id);

      const token = jwt.sign(
        { id: user.id, matricula: user.matricula, roles },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      return res.status(200).json({
        success: true,
        message: "Inicio de sesión exitoso",
        dataUser: {
          id: user.id,
          nombre: user.nombre,
          apellido_paterno: user.apellido_paterno,
          apellido_materno: user.apellido_materno,
          matricula: user.matricula,
          telefono: user.telefono,
          roles,
        },
        token,
      });
    } catch (error) {
      console.error("Error en login:", error);
      return res
        .status(500)
        .json({ success: false, message: "Error al iniciar sesión" });
    }
  },

  async verifySession(req, res) {
    try {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res
          .status(401)
          .json({ success: false, message: "No se proporcionó token" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByMatricula(decoded.matricula);

      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Usuario no encontrado" });
      }

      const roles = await User.getRolesByUserId(user.id);

      return res.status(200).json({
        success: true,
        message: "Sesión válida",
        data: { ...user, roles },
      });
    } catch (error) {
      console.error("Error en verifySession:", error);
      return res
        .status(401)
        .json({ success: false, message: "Sesión inválida" });
    }
  },

  async logout(req, res) {
    return res
      .status(200)
      .json({ success: true, message: "Sesión cerrada correctamente" });
  },

  async getProfile(req, res) {
    try {
      if (!req.user || !req.user.id) {
        return res
          .status(401)
          .json({ success: false, message: "Usuario no autenticado" });
      }

      const { id } = req.user;

      // 🔹 Obtener roles del usuario
      const roles = await User.getRolesByUserId(id);
      if (!roles || roles.length === 0) {
        return res
          .status(403)
          .json({ success: false, message: "Usuario sin roles asignados" });
      }

      // 🔹 Obtener perfil basado en los roles
      const profileData = await User.getProfileByRoles(id, roles);
      if (!profileData) {
        return res
          .status(404)
          .json({ success: false, message: "Perfil no encontrado" });
      }

      return res.status(200).json({
        success: true,
        message: "Perfil obtenido correctamente",
        data: profileData,
      });
    } catch (error) {
      console.error("Error en getProfile:", error);
      return res.status(500).json({
        success: false,
        message: "Error al obtener el perfil",
        error: error.message,
      });
    }
  },

  async getSummary(req, res) {
    try {
      const db = require("../config/config");
      // Consulta eficiente: cuenta usuarios por rol
      const counts = await db.manyOrNone(`
        SELECT rol, COUNT(*) as total
        FROM Usuario_Rol
        GROUP BY rol
      `);
      // Mapeo de roles a los nombres esperados
      let profesores = 0, estudiantes = 0, padres = 0, administradores = 0;
      counts.forEach(c => {
        if (c.rol === 'admin') administradores = parseInt(c.total, 10);
        if (c.rol === 'profesor' || c.rol === 'docente') profesores += parseInt(c.total, 10);
        if (c.rol === 'estudiante' || c.rol === 'alumno') estudiantes += parseInt(c.total, 10);
        if (c.rol === 'padre') padres += parseInt(c.total, 10);
      });
      // Lista de usuarios para la tabla (puede seguir como antes)
      const users = await require("../models/user").getAll();
      const lista = users.map(u => {
        let rol = Array.isArray(u.roles) ? u.roles[0] : u.rol || '';
        return {
          id: u.id,
          nombre: u.nombre + (u.apellido_paterno ? ' ' + u.apellido_paterno : ''),
          email: u.correo,
          rol: rol,
          estado: u.estado || 'activo',
          grupo: u.grupo || '',
          fechaRegistro: u.fecha_creacion || '',
        };
      });
      res.json({ profesores, estudiantes, padres, administradores, lista });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener resumen de usuarios', details: error.message });
    }
  },
};
