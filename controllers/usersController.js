const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { userValidationSchemas, validateRequest } = require("../utils/validation");
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
      // Validación con Joi
      const { error } = userValidationSchemas.create.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: "Datos de entrada inválidos",
          details: error.details.map(detail => detail.message)
        });
      }

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
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  async update(req, res) {
    try {
      // Validación con Joi
      const { error } = userValidationSchemas.update.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: "Datos de entrada inválidos",
          details: error.details.map(detail => detail.message)
        });
      }

      const {
        id,
        nombre,
        apellido_paterno,
        apellido_materno,
        correo,
        telefono,
        roles,
      } = req.body;

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
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

      const accessToken = jwt.sign(
        { id: user.id, matricula: user.matricula, roles },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      // Enviar tokens como cookies httpOnly
      res.cookie("token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, // 15 minutos
      });
      // Cookie de refresh
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
      });

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
        token: accessToken,
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
      const token =
        req.cookies.token || req.headers.authorization?.split(" ")[1];

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

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.cookies;
      
      if (!refreshToken) {
        console.log("No refresh token provided in cookies");
        return res
          .status(400)
          .json({ success: false, message: "No se proporcionó refresh token" });
      }
      
      let decoded;
      try {
        decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      } catch (err) {
        console.log("Invalid or expired refresh token:", err.message);
        return res.status(400).json({
          success: false,
          message: "Refresh token inválido o expirado",
        });
      }
      
      const user = await User.findByUserId(decoded.id);
      if (!user) {
        console.log("User not found for refresh token");
        return res
          .status(400)
          .json({ success: false, message: "Usuario no encontrado" });
      }
      
      const roles = await User.getRolesByUserId(user.id);
      const newAccessToken = jwt.sign(
        { id: user.id, matricula: user.matricula, roles },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );
      
      res.cookie("token", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
      });
      
      console.log("Token refreshed successfully for user:", user.matricula);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error en refreshToken:", error);
      return res
        .status(500)
        .json({ success: false, message: "Error al refrescar token" });
    }
  },

  async logout(req, res) {
    // Eliminar cookie
    const token = req.cookies.token;
    if (token) {
      const { add } = require("../utils/tokenBlacklist");
      // acceso token expira en 15min
      await add(token, 15 * 60 * 1000);
    }
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
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
      console.log('Role counts from DB:', counts); // Debug log
      
      // Mapeo de roles a los nombres esperados
      let profesores = 0,
        estudiantes = 0,
        padres = 0,
        administradores = 0;
      counts.forEach((c) => {
        console.log(`Processing role: ${c.rol}, count: ${c.total}`); // Debug log
        if (c.rol === "admin") administradores = parseInt(c.total, 10);
        if (c.rol === "profesor" || c.rol === "docente")
          profesores += parseInt(c.total, 10);
        if (c.rol === "estudiante" || c.rol === "alumno")
          estudiantes += parseInt(c.total, 10);
        if (c.rol === "padre" || c.rol === "tutor") 
          padres += parseInt(c.total, 10);
        // Mapear roles del enum de la base de datos
        if (c.rol === "directivo" || c.rol === "administrativo") 
          administradores += parseInt(c.total, 10);
      });
      
      console.log('Final counts:', { profesores, estudiantes, padres, administradores }); // Debug log
      // Lista de usuarios para la tabla
      const users = await User.getAll();
      const lista = users.map((u) => {
        // Parse PostgreSQL array format {admin,alumno} to JavaScript array
        let rolesArray = [];
        if (u.roles) {
          if (typeof u.roles === 'string') {
            // Remove braces and split by comma
            rolesArray = u.roles.replace(/[{}]/g, '').split(',').filter(r => r && r.trim());
          } else if (Array.isArray(u.roles)) {
            rolesArray = u.roles.filter(r => r !== null);
          }
        }
        
        const rol = rolesArray.length > 0 ? rolesArray[0] : "";
        return {
          id: u.id,
          nombre: `${u.nombre}${u.apellido_paterno ? ` ${u.apellido_paterno}` : ''}`,
          email: u.correo,
          rol,
          roles: rolesArray,
          estado: u.estado || "activo",
          grupo: u.grupo || "",
          fechaRegistro: u.fecha_creacion || "",
          telefono: u.telefono || ""
        };
      });
      res.json({ profesores, estudiantes, padres, administradores, lista });
    } catch (error) {
      res.status(500).json({
        error: "Error al obtener resumen de usuarios",
        details: error.message,
      });
    }
  },
};
