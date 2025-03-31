const authenticate = require("../middleware/authenticate");
const AsistenciasController = require("../controllers/asistenciasController");
const requireRole = require("../middleware/requireRole");

module.exports = (app) => {
  app.post(
    "/api/asistencia/registrar",
    authenticate,
    requireRole("docente"),
    AsistenciasController.registrarAsistencia
  );

  // Obtener todas las asistencias
  app.get("/api/asistencia", authenticate, AsistenciasController.obtenerTodas);

  // Obtener asistencias por alumno
  app.get(
    "/api/asistencia/alumno/:alumno_id",
    authenticate,
    AsistenciasController.obtenerPorAlumno
  );

  // Obtener asistencias por clase
  app.get(
    "/api/asistencia/clase/:clase_id",
    authenticate,
    AsistenciasController.obtenerPorClase
  );
};
