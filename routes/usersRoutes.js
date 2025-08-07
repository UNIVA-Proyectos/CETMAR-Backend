const UsersController = require("../controllers/usersController");
const authenticate = require("../middleware/authenticate");
const requireRoles = require("../middleware/requireRole");
const DashboardController = require("../controllers/dashboardController");
const { loginRateLimiter } = require("../middleware/rateLimit");

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
  app.post("/api/users/refresh-token", UsersController.refreshToken);

  //ACTUALIZAR DATOS
  app.put(
    "/api/users/update",
    authenticate,
    requireRoles(["admin"]),
    UsersController.update
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
};
