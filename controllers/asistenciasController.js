const Asistencia = require("../models/asistencia");

const AsistenciasController = {
  async registrarAsistenciasMasivas(req, res) {
    try {
      const { asistencias } = req.body;
      const docenteUsuarioId = req.user.id;

      if (!Array.isArray(asistencias) || asistencias.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Debe enviar al menos una asistencia",
        });
      }

      const cantidadRegistradas = await Asistencia.createMasiva(
        asistencias,
        docenteUsuarioId
      );

      return res.status(201).json({
        success: true,
        message: `Se registraron ${cantidadRegistradas} asistencias dentro del horario permitido.`,
      });
    } catch (error) {
      console.error("Error al registrar asistencias:", error);
      return res.status(500).json({
        success: false,
        message: "Error al registrar asistencias en lote",
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

  async actualizarEstadosMasivos(req, res) {
    const { actualizaciones } = req.body;

    if (!Array.isArray(actualizaciones) || actualizaciones.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Se requiere un arreglo de asistencias para actualizar",
      });
    }

    // Validar que cada entrada solo tenga id y estado
    for (let asistencia of actualizaciones) {
      if (
        typeof asistencia !== "object" ||
        !("id" in asistencia) ||
        !("estado" in asistencia) ||
        Object.keys(asistencia).length > 2
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Cada asistencia debe incluir únicamente 'id' y 'estado' válidos",
        });
      }
    }

    try {
      await Asistencia.updateEstadosMasivos(actualizaciones);

      return res.status(200).json({
        success: true,
        message: "Estados de asistencias actualizados correctamente",
      });
    } catch (error) {
      console.error("Error al actualizar estados:", error);
      return res.status(500).json({
        success: false,
        message: "Error al actualizar asistencias",
        error: error.message,
      });
    }
  },
  async obtenerPorClaseYFecha(req, res) {
    try {
      const { clase_id, fecha } = req.params;

      if (!clase_id || !fecha) {
        return res.status(400).json({
          success: false,
          message: "Clase y fecha son requeridos",
        });
      }

      const asistencias = await Asistencia.findByClaseYFecha(clase_id, fecha);

      return res.status(200).json({
        success: true,
        asistencias,
      });
    } catch (error) {
      console.error("Error al obtener asistencias por clase y fecha:", error);
      return res.status(500).json({
        success: false,
        message: "Error al obtener asistencias",
        error: error.message,
      });
    }
  },
};

module.exports = AsistenciasController;
