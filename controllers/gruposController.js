const Grupo = require("../models/grupo");

module.exports = {
  // Obtener todos los grupos
  async getAll(req, res) {
    try {
      console.log("🔍 Obteniendo grupos...");
      const grupos = await Grupo.getAll();
      console.log("Grupos obtenidos:", grupos);
      
      // Función helper local para determinar turno
      const determinarTurno = (nombre) => {
        if (nombre && (nombre.includes('V') || nombre.includes('Vespertino'))) {
          return 'vespertino';
        }
        return 'matutino';
      };
      
      // Transformar datos para el frontend
      const gruposFormateados = grupos.map((grupo) => {
        return {
          id: grupo.id,
          nombre: grupo.nombre,
          periodo: grupo.periodo_nombre,
          tutor: grupo.tutor_nombre || 'Sin asignar',
          totalEstudiantes: parseInt(grupo.total_estudiantes) || 0,
          asistenciaPromedio: Math.round(parseFloat(grupo.asistencia_promedio) || 0),
          rendimientoPromedio: Math.round(parseFloat(grupo.rendimiento_promedio) || 0),
          turno: determinarTurno(grupo.nombre),
          estado: 'activo' // Por defecto activo
        };
      });

      console.log("Grupos formateados:", gruposFormateados);

      return res.status(200).json({
        success: true,
        data: gruposFormateados
      });
    } catch (error) {
      console.error("Error al obtener grupos:", error);
      return res.status(500).json({
        success: false,
        message: "Error al obtener los grupos",
        error: error.message
      });
    }
  },

  // Obtener grupo por ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const grupo = await Grupo.findById(id);

      if (!grupo) {
        return res.status(404).json({
          success: false,
          message: "Grupo no encontrado"
        });
      }

      // Función helper local para determinar turno
      const determinarTurno = (nombre) => {
        if (nombre && (nombre.includes('V') || nombre.includes('Vespertino'))) {
          return 'vespertino';
        }
        return 'matutino';
      };

      const grupoFormateado = {
        id: grupo.id,
        nombre: grupo.nombre,
        periodo: grupo.periodo_nombre,
        tutor: grupo.tutor_nombre || 'Sin asignar',
        totalEstudiantes: parseInt(grupo.total_estudiantes) || 0,
        asistenciaPromedio: Math.round(parseFloat(grupo.asistencia_promedio) || 0),
        rendimientoPromedio: Math.round(parseFloat(grupo.rendimiento_promedio) || 0),
        turno: determinarTurno(grupo.nombre),
        estado: 'activo'
      };

      return res.status(200).json({
        success: true,
        data: grupoFormateado
      });
    } catch (error) {
      console.error("Error al obtener grupo:", error);
      return res.status(500).json({
        success: false,
        message: "Error al obtener el grupo",
        error: error.message
      });
    }
  },

  // Crear nuevo grupo
  async create(req, res) {
    try {
      const { nombre, periodo_id, tutor_id } = req.body;

      // Validaciones básicas
      if (!nombre) {
        return res.status(400).json({
          success: false,
          message: "El nombre del grupo es requerido"
        });
      }

      const nuevoGrupo = await Grupo.create({
        nombre,
        periodo_id: periodo_id || null,
        tutor_id: tutor_id || null
      });

      return res.status(201).json({
        success: true,
        message: "Grupo creado exitosamente",
        data: { id: nuevoGrupo.id }
      });
    } catch (error) {
      console.error("Error al crear grupo:", error);
      return res.status(500).json({
        success: false,
        message: "Error al crear el grupo",
        error: error.message
      });
    }
  },

  // Actualizar grupo
  async update(req, res) {
    try {
      const { id } = req.params;
      const { nombre, periodo_id, tutor_id } = req.body;

      // Validar que el grupo existe
      const grupoExistente = await Grupo.findById(id);
      if (!grupoExistente) {
        return res.status(404).json({
          success: false,
          message: "Grupo no encontrado"
        });
      }

      const grupoActualizado = await Grupo.update(id, {
        nombre: nombre || grupoExistente.nombre,
        periodo_id: periodo_id || grupoExistente.periodo_id,
        tutor_id: tutor_id || grupoExistente.tutor_id
      });

      return res.status(200).json({
        success: true,
        message: "Grupo actualizado exitosamente",
        data: { id: grupoActualizado.id }
      });
    } catch (error) {
      console.error("Error al actualizar grupo:", error);
      return res.status(500).json({
        success: false,
        message: "Error al actualizar el grupo",
        error: error.message
      });
    }
  },

  // Eliminar grupo
  async delete(req, res) {
    try {
      const { id } = req.params;

      // Validar que el grupo existe
      const grupoExistente = await Grupo.findById(id);
      if (!grupoExistente) {
        return res.status(404).json({
          success: false,
          message: "Grupo no encontrado"
        });
      }

      // Verificar si tiene estudiantes asignados
      if (parseInt(grupoExistente.total_estudiantes) > 0) {
        return res.status(400).json({
          success: false,
          message: "No se puede eliminar un grupo que tiene estudiantes asignados"
        });
      }

      await Grupo.delete(id);

      return res.status(200).json({
        success: true,
        message: "Grupo eliminado exitosamente"
      });
    } catch (error) {
      console.error("Error al eliminar grupo:", error);
      return res.status(500).json({
        success: false,
        message: "Error al eliminar el grupo",
        error: error.message
      });
    }
  },

  // Obtener estudiantes de un grupo
  async getEstudiantes(req, res) {
    try {
      const { id } = req.params;
      const estudiantes = await Grupo.getEstudiantes(id);

      return res.status(200).json({
        success: true,
        data: estudiantes
      });
    } catch (error) {
      console.error("Error al obtener estudiantes del grupo:", error);
      return res.status(500).json({
        success: false,
        message: "Error al obtener los estudiantes del grupo",
        error: error.message
      });
    }
  },

  // Obtener clases de un grupo
  async getClases(req, res) {
    try {
      const { id } = req.params;
      const clases = await Grupo.getClases(id);

      return res.status(200).json({
        success: true,
        data: clases
      });
    } catch (error) {
      console.error("Error al obtener clases del grupo:", error);
      return res.status(500).json({
        success: false,
        message: "Error al obtener las clases del grupo",
        error: error.message
      });
    }
  },

  // Obtener estadísticas del grupo
  async getStats(req, res) {
    try {
      const { id } = req.params;
      const stats = await Grupo.getStats(id);

      return res.status(200).json({
        success: true,
        data: {
          totalEstudiantes: parseInt(stats.total_estudiantes) || 0,
          estudiantesActivos: parseInt(stats.estudiantes_activos) || 0,
          asistenciaPromedio: Math.round(parseFloat(stats.asistencia_promedio) || 0),
          rendimientoPromedio: Math.round(parseFloat(stats.rendimiento_promedio) || 0),
          totalClases: parseInt(stats.total_clases) || 0
        }
      });
    } catch (error) {
      console.error("Error al obtener estadísticas del grupo:", error);
      return res.status(500).json({
        success: false,
        message: "Error al obtener las estadísticas del grupo",
        error: error.message
      });
    }
  },

  // Buscar grupos por nombre
  async searchByName(req, res) {
    try {
      const { q } = req.query;
      
      if (!q) {
        return res.status(400).json({
          success: false,
          message: "Término de búsqueda requerido"
        });
      }

      const grupos = await Grupo.searchByName(q);
      
      // Función helper local para determinar turno
      const determinarTurno = (nombre) => {
        if (nombre && (nombre.includes('V') || nombre.includes('Vespertino'))) {
          return 'vespertino';
        }
        return 'matutino';
      };
      
      const gruposFormateados = grupos.map(grupo => ({
        id: grupo.id,
        nombre: grupo.nombre,
        periodo: grupo.periodo_nombre,
        tutor: grupo.tutor_nombre || 'Sin asignar',
        totalEstudiantes: parseInt(grupo.total_estudiantes) || 0,
        turno: determinarTurno(grupo.nombre),
        estado: 'activo'
      }));

      return res.status(200).json({
        success: true,
        data: gruposFormateados
      });
    } catch (error) {
      console.error("Error al buscar grupos:", error);
      return res.status(500).json({
        success: false,
        message: "Error al buscar grupos",
        error: error.message
      });
    }
  },

  // Obtener grupos por periodo
  async getByPeriodo(req, res) {
    try {
      const { periodoId } = req.params;
      const grupos = await Grupo.getByPeriodo(periodoId);
      
      // Función helper local para determinar turno
      const determinarTurno = (nombre) => {
        if (nombre && (nombre.includes('V') || nombre.includes('Vespertino'))) {
          return 'vespertino';
        }
        return 'matutino';
      };
      
      const gruposFormateados = grupos.map(grupo => ({
        id: grupo.id,
        nombre: grupo.nombre,
        periodo: grupo.periodo_nombre,
        tutor: grupo.tutor_nombre || 'Sin asignar',
        totalEstudiantes: parseInt(grupo.total_estudiantes) || 0,
        turno: determinarTurno(grupo.nombre),
        estado: 'activo'
      }));

      return res.status(200).json({
        success: true,
        data: gruposFormateados
      });
    } catch (error) {
      console.error("Error al obtener grupos por periodo:", error);
      return res.status(500).json({
        success: false,
        message: "Error al obtener grupos por periodo",
        error: error.message
      });
    }
  },

  // Obtener grupos por tutor
  async getByTutor(req, res) {
    try {
      const { tutorId } = req.params;
      const grupos = await Grupo.getByTutor(tutorId);
      
      // Función helper local para determinar turno
      const determinarTurno = (nombre) => {
        if (nombre && (nombre.includes('V') || nombre.includes('Vespertino'))) {
          return 'vespertino';
        }
        return 'matutino';
      };
      
      const gruposFormateados = grupos.map(grupo => ({
        id: grupo.id,
        nombre: grupo.nombre,
        periodo: grupo.periodo_nombre,
        tutor: grupo.tutor_nombre || 'Sin asignar',
        totalEstudiantes: parseInt(grupo.total_estudiantes) || 0,
        turno: determinarTurno(grupo.nombre),
        estado: 'activo'
      }));

      return res.status(200).json({
        success: true,
        data: gruposFormateados
      });
    } catch (error) {
      console.error("Error al obtener grupos por tutor:", error);
      return res.status(500).json({
        success: false,
        message: "Error al obtener grupos por tutor",
        error: error.message
      });
    }
  },


};
