const Asistencia = require("../models/asistencia");

const AsistenciasController = {
  async registrarAsistencia(req, res) {
    try {
      const { alumno_id, clase_id, fecha, estado } = req.body;

      // Validar que todos los datos están presentes
      if (!alumno_id || !clase_id || !fecha || !estado) {
        return res.status(400).json({
          success: false,
          message: "Todos los campos son obligatorios",
        });
      }

      // Validar estado
      const estadosPermitidos = [
        "presente",
        "retardo",
        "ausente",
        "justificado",
      ];
      if (!estadosPermitidos.includes(estado.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: "Estado de asistencia no válido",
        });
      }

      // Registrar asistencia usando el modelo
      const nuevaAsistencia = await Asistencia.create({
        alumno_id,
        clase_id,
        fecha,
        estado,
      });

      return res.status(201).json({
        success: true,
        message: "Asistencia registrada con éxito",
        asistencia: nuevaAsistencia,
      });
    } catch (error) {
      console.error("Error al registrar asistencia:", error);
      return res.status(500).json({
        success: false,
        message: "Error al registrar asistencia",
        error: error.message,
      });
    }
  },

  async obtenerTodas(req, res) {
    try {
      const asistencias = await Asistencia.getAll();
      return res.status(200).json({ success: true, asistencias });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error al obtener asistencias",
        error: error.message,
      });
    }
  },

  async obtenerPorAlumno(req, res) {
    try {
      const { alumno_id } = req.params;
      const asistencias = await Asistencia.findByAlumno(alumno_id);
      return res.status(200).json({ success: true, asistencias });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error al obtener asistencias",
        error: error.message,
      });
    }
  },

  async obtenerPorClase(req, res) {
    try {
      const { clase_id } = req.params;
      const asistencias = await Asistencia.findByClase(clase_id);
      return res.status(200).json({ success: true, asistencias });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error al obtener asistencias",
        error: error.message,
      });
    }
  },
};

module.exports = AsistenciasController;