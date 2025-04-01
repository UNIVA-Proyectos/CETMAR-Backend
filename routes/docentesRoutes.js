const docentesControllers = require("../controllers/docentesControllers");
const authenticate = require("../middleware/authenticate");

module.exports = (app) => {
  // Obtener todos los docentes
  app.get(
    "/api/docentes/getAll",
    authenticate,
    docentesControllers.getAllDocentes
  );

  //Obtener un docente por ID (jwt)
  app.get(
    "/api/docente/findById/:id",
    authenticate,
    docentesControllers.findById
  );

  // Crear un nuevo docente
  app.post("/api/docente/create", authenticate, docentesControllers.register);

  // Actualizar datos de un docente
  app.put("/api/docente/update", authenticate, docentesControllers.update);
};
