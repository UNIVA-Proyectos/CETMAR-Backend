const UsersController = require("../controllers/usersController");
const authenticate = require("../middleware/authenticate");
const requireRoles = require("../middleware/requireRole");
const DashboardController = require("../controllers/dashboardController");
const { loginRateLimiter, refreshTokenRateLimiter } = require("../middleware/rateLimit");

module.exports = (app) => {
  //Obtener datos
  app.get("/api/users/getAll", authenticate, UsersController.getAll);
  app.get("/api/users/findById/:id", authenticate, UsersController.findById);
  app.get("/api/users/profile", authenticate, UsersController.getProfile);
  app.get(
    "/api/users/verify-session",
    authenticate,
    UsersController.verifySession
  );

  // GUARDAR DATOS
  app.post(
    "/api/users/create",
    authenticate,
    requireRoles(["admin"]),
    UsersController.register
  );

  app.post("/api/users/login", loginRateLimiter, UsersController.login);
  app.post("/api/users/logout", UsersController.logout);
  app.post("/api/users/refresh-token", refreshTokenRateLimiter, UsersController.refreshToken);

  //ACTUALIZAR DATOS
  app.put(
    "/api/users/update",
    authenticate,
    requireRoles(["admin"]),
    UsersController.update
  );

  //ELIMINAR DATOS
  app.delete(
    "/api/users/:id",
    authenticate,
    requireRoles(["admin"]),
    UsersController.delete
  );

  // Endpoint de estadísticas del panel admin
  app.get(
    "/api/dashboard/admin-stats",
    authenticate,
    requireRoles(["admin", "directivo", "administrativo"]),
    DashboardController.getAdminStats
  );

  // Endpoint de resumen de usuarios por rol
  app.get(
    "/api/users/summary",
    authenticate,
    requireRoles(["admin", "directivo", "administrativo"]),
    UsersController.getSummary
  );

  // Endpoints para estudiantes
  app.get(
    "/api/students/current",
    authenticate,
    requireRoles(["alumno"]),
    UsersController.getCurrentStudent
  );

  app.get(
    "/api/students/current/grades",
    authenticate,
    requireRoles(["alumno"]),
    UsersController.getCurrentStudentGrades
  );

  app.get(
    "/api/students/current/attendance",
    authenticate,
    requireRoles(["alumno"]),
    UsersController.getCurrentStudentAttendance
  );

  app.get(
    "/api/students/current/incidents",
    authenticate,
    requireRoles(["alumno"]),
    UsersController.getCurrentStudentIncidents
  );

  app.get(
    "/api/students/current/notifications",
    authenticate,
    requireRoles(["alumno"]),
    UsersController.getCurrentStudentNotifications
  );

  app.get(
    "/api/students/current/stats",
    authenticate,
    requireRoles(["alumno"]),
    UsersController.getCurrentStudentStats
  );
};
