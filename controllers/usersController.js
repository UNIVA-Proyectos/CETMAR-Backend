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
          id: u.matricula, // La matrícula es el ID visible
          matricula: u.matricula, // Campo específico de matrícula
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

  async delete(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar que el usuario existe
      const user = await User.findByMatricula(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado"
        });
      }

      // Eliminar roles del usuario primero
      const db = require("../config/config");
      await db.none('DELETE FROM Usuario_Rol WHERE usuario_id = $1', [user.id]);
      
      // Eliminar el usuario
      await db.none('DELETE FROM Usuarios WHERE id = $1', [user.id]);

      return res.status(200).json({
        success: true,
        message: "Usuario eliminado correctamente"
      });
    } catch (error) {
      console.error("Error en delete:", error);
      return res.status(500).json({
        success: false,
        message: "Error al eliminar el usuario",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Métodos para estudiantes
  async getCurrentStudent(req, res) {
    try {
      const userId = req.user.id;
      const db = require("../config/config");
      
      // Obtener información del estudiante actual
      const student = await db.oneOrNone(`
        SELECT 
          u.id,
          u.matricula,
          u.nombre,
          u.apellido_paterno,
          u.apellido_materno,
          u.correo,
          u.telefono,
          u.fecha_creacion,
          a.grupo,
          c.nombre as carrera
        FROM Usuarios u
        LEFT JOIN Alumnos a ON u.id = a.usuario_id
        LEFT JOIN Carreras c ON a.carrera_id = c.id
        WHERE u.id = $1
      `, [userId]);

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Estudiante no encontrado"
        });
      }

      return res.json({
        success: true,
        data: {
          nombre: `${student.nombre} ${student.apellido_paterno || ''} ${student.apellido_materno || ''}`.trim(),
          matricula: student.matricula,
          grupo: student.grupo || 'Sin grupo',
          carrera: student.carrera || 'Sin carrera',
          email: student.correo,
          telefono: student.telefono,
          fechaRegistro: student.fecha_creacion
        }
      });
    } catch (error) {
      console.error("Error en getCurrentStudent:", error);
      return res.status(500).json({
        success: false,
        message: "Error al obtener información del estudiante",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  async getCurrentStudentGrades(req, res) {
    try {
      const userId = req.user.id;
      const db = require("../config/config");
      
      // Obtener calificaciones del estudiante
      const grades = await db.manyOrNone(`
        SELECT 
          m.nombre as materia,
          c.calificacion,
          COUNT(CASE WHEN a.estado = 'Inasistencia' THEN 1 END) as faltas
        FROM Calificaciones c
        JOIN Materias m ON c.materia_id = m.id
        LEFT JOIN Asistencias a ON c.alumno_id = a.alumno_id AND c.materia_id = a.materia_id
        WHERE c.alumno_id = (SELECT id FROM Alumnos WHERE usuario_id = $1)
        GROUP BY m.nombre, c.calificacion
      `, [userId]);

      const promedio = grades.length > 0 
        ? grades.reduce((sum, grade) => sum + parseFloat(grade.calificacion), 0) / grades.length 
        : 0;

      return res.json({
        success: true,
        data: {
          promedio: Math.round(promedio * 10) / 10,
          materias: grades.map(grade => ({
            nombre: grade.materia,
            calificacion: parseFloat(grade.calificacion),
            faltas: parseInt(grade.faltas) || 0
          }))
        }
      });
    } catch (error) {
      console.error("Error en getCurrentStudentGrades:", error);
      return res.json({
        success: true,
        data: {
          promedio: 0,
          materias: []
        }
      });
    }
  },

  async getCurrentStudentAttendance(req, res) {
    try {
      const userId = req.user.id;
      const db = require("../config/config");
      
      // Obtener estadísticas de asistencia
      const stats = await db.oneOrNone(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN estado = 'Asistencia' THEN 1 END) as presentes,
          COUNT(CASE WHEN estado = 'Inasistencia' THEN 1 END) as faltas,
          COUNT(CASE WHEN estado = 'Retardo' THEN 1 END) as retardos
        FROM Asistencias a
        JOIN Alumnos al ON a.alumno_id = al.id
        WHERE al.usuario_id = $1
      `, [userId]);

      const total = parseInt(stats?.total) || 0;
      const presentes = parseInt(stats?.presentes) || 0;
      const faltas = parseInt(stats?.faltas) || 0;
      const retardos = parseInt(stats?.retardos) || 0;
      const porcentaje = total > 0 ? Math.round((presentes / total) * 100) : 0;

      return res.json({
        success: true,
        data: {
          total,
          presentes,
          faltas,
          retardos,
          porcentaje
        }
      });
    } catch (error) {
      console.error("Error en getCurrentStudentAttendance:", error);
      return res.json({
        success: true,
        data: {
          total: 0,
          presentes: 0,
          faltas: 0,
          retardos: 0,
          porcentaje: 0
        }
      });
    }
  },

  async getCurrentStudentIncidents(req, res) {
    try {
      const userId = req.user.id;
      const db = require("../config/config");
      
      // Obtener incidencias del estudiante
      const incidents = await db.manyOrNone(`
        SELECT 
          i.fecha,
          i.motivo as tipo,
          i.descripcion,
          i.estado
        FROM Incidencias i
        JOIN Alumnos a ON i.alumno_id = a.id
        WHERE a.usuario_id = $1
        ORDER BY i.fecha DESC
        LIMIT 10
      `, [userId]);

      return res.json({
        success: true,
        data: incidents.map(incident => ({
          fecha: incident.fecha,
          tipo: incident.tipo,
          descripcion: incident.descripcion,
          estado: incident.estado
        }))
      });
    } catch (error) {
      console.error("Error en getCurrentStudentIncidents:", error);
      return res.json({
        success: true,
        data: []
      });
    }
  },

  async getCurrentStudentNotifications(req, res) {
    try {
      const userId = req.user.id;
      const db = require("../config/config");
      
      // Obtener notificaciones del estudiante
      const notifications = await db.manyOrNone(`
        SELECT 
          n.id,
          n.mensaje,
          n.fecha,
          n.leido
        FROM Notificaciones n
        JOIN Alumnos a ON n.alumno_id = a.id
        WHERE a.usuario_id = $1
        ORDER BY n.fecha DESC
        LIMIT 10
      `, [userId]);

      return res.json({
        success: true,
        data: notifications.map(notification => ({
          id: notification.id,
          mensaje: notification.mensaje,
          fecha: notification.fecha,
          leida: notification.leido
        }))
      });
    } catch (error) {
      console.error("Error en getCurrentStudentNotifications:", error);
      return res.json({
        success: true,
        data: []
      });
    }
  },

  async getCurrentStudentStats(req, res) {
    try {
      const userId = req.user.id;
      const db = require("../config/config");
      
      // Obtener estadísticas generales del estudiante
      const stats = await db.oneOrNone(`
        SELECT 
          COUNT(DISTINCT a.id) as total_clases,
          COUNT(CASE WHEN a.estado = 'Asistencia' THEN 1 END) as asistencias,
          COUNT(CASE WHEN a.estado = 'Inasistencia' THEN 1 END) as faltas,
          COUNT(CASE WHEN a.estado = 'Retardo' THEN 1 END) as retardos,
          COUNT(DISTINCT i.id) as total_incidencias
        FROM Alumnos al
        LEFT JOIN Asistencias a ON al.id = a.alumno_id
        LEFT JOIN Incidencias i ON al.id = i.alumno_id
        WHERE al.usuario_id = $1
      `, [userId]);

      return res.json({
        success: true,
        data: {
          totalClases: parseInt(stats?.total_clases) || 0,
          asistencias: parseInt(stats?.asistencias) || 0,
          faltas: parseInt(stats?.faltas) || 0,
          retardos: parseInt(stats?.retardos) || 0,
          totalIncidencias: parseInt(stats?.total_incidencias) || 0
        }
      });
    } catch (error) {
      console.error("Error en getCurrentStudentStats:", error);
      return res.json({
        success: true,
        data: {
          totalClases: 0,
          asistencias: 0,
          faltas: 0,
          retardos: 0,
          totalIncidencias: 0
        }
      });
    }
  },
};
