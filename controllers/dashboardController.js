const db = require("../config/config");

const DashboardController = {};

DashboardController.getAdminStats = async (req, res) => {
  try {
    // Total de alumnos activos
    const totalAlumnos = await db.oneOrNone(
      "SELECT COUNT(*) FROM alumnos WHERE estado = 'activo';"
    );

    // Asistencias de hoy
    const hoy = new Date().toISOString().slice(0, 10); // formato YYYY-MM-DD
    const asistenciasHoy = await db.oneOrNone(
      "SELECT COUNT(*) FROM asistencias WHERE fecha = $1;",
      [hoy]
    );

    // Incidencias activas (pendientes)
    const incidenciasActivas = await db.oneOrNone(
      "SELECT COUNT(*) FROM incidencias WHERE estado = 'pendiente';"
    );

    // Reportes pendientes (igual a incidencias pendientes)
    const reportesPendientes = incidenciasActivas;

    res.json({
      totalAlumnos: parseInt(totalAlumnos.count, 10),
      asistenciasHoy: parseInt(asistenciasHoy.count, 10),
      incidenciasActivas: parseInt(incidenciasActivas.count, 10),
      reportesPendientes: parseInt(reportesPendientes.count, 10),
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener estadísticas", details: error.message });
  }
};

module.exports = DashboardController; 