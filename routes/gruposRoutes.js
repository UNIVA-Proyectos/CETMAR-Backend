const gruposController = require("../controllers/gruposController");
const authenticate = require("../middleware/authenticate");
const requireRole = require("../middleware/requireRole");

module.exports = (app) => {
  // Obtener todos los grupos
  app.get(
    "/api/groups",
    authenticate,
    requireRole(["admin", "directivo", "administrativo", "docente", "tutor"]),
    gruposController.getAll
  );

  // Endpoint temporal para testing sin autenticación
  app.get(
    "/api/groups/test",
    async (req, res) => {
      try {
        console.log("🔍 Endpoint de test llamado");
        const db = require("../config/config");
        const result = await db.manyOrNone("SELECT * FROM grupos LIMIT 5");
        console.log("📊 Resultado directo de DB:", result);
        res.json({
          success: true,
          data: result,
          message: "Test exitoso"
        });
      } catch (error) {
        console.error("❌ Error en test:", error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Obtener grupo por ID
  app.get(
    "/api/groups/:id",
    authenticate,
    requireRole(["admin", "directivo", "administrativo", "docente", "tutor"]),
    gruposController.getById
  );

  // Crear nuevo grupo
  app.post(
    "/api/groups",
    authenticate,
    requireRole(["admin", "directivo", "administrativo"]),
    gruposController.create
  );

  // Actualizar grupo
  app.put(
    "/api/groups/:id",
    authenticate,
    requireRole(["admin", "directivo", "administrativo"]),
    gruposController.update
  );

  // Eliminar grupo
  app.delete(
    "/api/groups/:id",
    authenticate,
    requireRole(["admin", "directivo"]),
    gruposController.delete
  );

  // Obtener estudiantes de un grupo
  app.get(
    "/api/groups/:id/students",
    authenticate,
    requireRole(["admin", "directivo", "administrativo", "docente", "tutor"]),
    gruposController.getEstudiantes
  );

  // Obtener clases de un grupo
  app.get(
    "/api/groups/:id/classes",
    authenticate,
    requireRole(["admin", "directivo", "administrativo", "docente", "tutor"]),
    gruposController.getClases
  );

  // Obtener estadísticas de un grupo
  app.get(
    "/api/groups/:id/stats",
    authenticate,
    requireRole(["admin", "directivo", "administrativo", "docente", "tutor"]),
    gruposController.getStats
  );

  // Buscar grupos por nombre
  app.get(
    "/api/groups/search",
    authenticate,
    requireRole(["admin", "directivo", "administrativo", "docente", "tutor"]),
    gruposController.searchByName
  );

  // Obtener grupos por periodo
  app.get(
    "/api/groups/periodo/:periodoId",
    authenticate,
    requireRole(["admin", "directivo", "administrativo", "docente", "tutor"]),
    gruposController.getByPeriodo
  );

  // Obtener grupos por tutor
  app.get(
    "/api/groups/tutor/:tutorId",
    authenticate,
    requireRole(["admin", "directivo", "administrativo", "tutor"]),
    gruposController.getByTutor
  );
};
