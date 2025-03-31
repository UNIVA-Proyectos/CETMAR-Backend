const UsersController = require("../controllers/usersController");
const authenticate = require("../middleware/authenticate");

module.exports = (app) => {
  //Obtener datos
  app.get("/api/users/getAll", UsersController.getAll);
  app.get("/api/users/findById/:id", authenticate, UsersController.findById);
  app.get("/api/users/profile", authenticate, UsersController.getProfile);
  app.get(
    "/api/users/verify-session",
    authenticate,
    UsersController.verifySession
  );

  // GUARDAR DATOS
  app.post("/api/users/create", authenticate, UsersController.register);

  app.post("/api/users/login", UsersController.login);
  app.post("/api/users/logout", UsersController.logout);

  //ACTUALIZAR DATOS
  app.put("/api/users/update", authenticate, UsersController.update);
};
