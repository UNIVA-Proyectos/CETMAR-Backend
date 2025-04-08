const authenticate = require("../middleware/authenticate");
const AsistenciasController = require("../controllers/asistenciasController");
const requireRole = require("../middleware/requireRole");

module.exports = (app) => {
  app.post(
    "/api/asistencia/registrar",
    authenticate,
    requireRole(["docente", "superadmin"]),
    AsistenciasController.registrarAsistenciasMasivas
  );

  // Obtener todas las asistencias
  app.get("/api/asistencia", authenticate, AsistenciasController.obtenerTodas);

  // Obtener asistencias por alumno
  app.get(
    "/api/asistencia/alumno/:alumno_id",
    authenticate,
    AsistenciasController.obtenerPorAlumno
  );
  // Obtener asistencias por clase y fecha
  app.get(
    "/api/asistencia/clase/:clase_id/fecha/:fecha",
    authenticate,
    AsistenciasController.obtenerPorClaseYFecha
  );

  // Obtener asistencias por clase
  app.get(
    "/api/asistencia/clase/:clase_id",
    authenticate,
    AsistenciasController.obtenerPorClase
  );
  //actualizacion de estaos de asistencias masivos
  app.put(
    "/api/asistencias/actualizar-estados",
    authenticate,
    AsistenciasController.actualizarEstadosMasivos
  );
};
