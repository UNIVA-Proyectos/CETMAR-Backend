const pool = require("../config/config");

const AsistenciasController = {
  registrarAsistencia: async (req, res) => {
    try {
      const { alumno_id, clase_id, fecha, estado } = req.body;

      // Validar que todos los datos estén presentes
      if (!alumno_id || !clase_id || !fecha || !estado) {
        return res.status(400).json({ success: false, message: "Todos los campos son obligatorios" });
      }

      // Convertir estado a minúsculas para que coincida con el ENUM en PostgreSQL
      const estadoNormalizado = estado.toLowerCase();  
      const estadosPermitidos = ["presente", "tarde", "falta", "justificado"]; // Minúsculas

      if (!estadosPermitidos.includes(estadoNormalizado)) {
        return res.status(400).json({ success: false, message: "Estado de asistencia no válido" });
      }

      // Insertar la asistencia en la BD
      const query = `
        INSERT INTO asistencias (alumno_id, clase_id, fecha, estado)
        VALUES ($1, $2, $3, $4) RETURNING *;
      `;
      const values = [alumno_id, clase_id, fecha, estadoNormalizado];

      const { rows } = await pool.query(query, values);

      res.status(201).json({ success: true, message: "Asistencia registrada con éxito", asistencia: rows[0] });

    } catch (error) {
      console.error("Error al registrar la asistencia:", error);
      res.status(500).json({ success: false, message: "Error al registrar la asistencia", error: error.message });
    }
  }
};

module.exports = AsistenciasController;
