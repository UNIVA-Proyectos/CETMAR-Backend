const alumnoController = require("../controllers/alumnoController");
const authenticate = require("../middleware/authenticate");
const requireRole = require("../middleware/requireRole");

module.exports = (app) => {
  // Obtener todos los estudiantes
  app.get("/api/students", authenticate, requireRole(["admin", "docente"]), alumnoController.getAllStudents);
  
  // Obtener estudiante por ID
  app.get("/api/students/:id", authenticate, requireRole(["admin", "docente"]), alumnoController.getStudentById);
  
  // Crear nuevo estudiante
  app.post("/api/students", authenticate, requireRole(["admin"]), alumnoController.createStudent);
  
  // Actualizar estudiante
  app.put("/api/students/:id", authenticate, requireRole(["admin"]), alumnoController.updateStudent);
  
  // Eliminar estudiante
  app.delete("/api/students/:id", authenticate, requireRole(["admin"]), alumnoController.deleteStudent);
  
  // Buscar estudiantes
  app.get("/api/students/search", authenticate, requireRole(["admin", "docente"]), alumnoController.searchStudents);
  
  // Obtener estadísticas de estudiantes
  app.get("/api/students/stats", authenticate, requireRole(["admin"]), alumnoController.getStudentsStats);
};
