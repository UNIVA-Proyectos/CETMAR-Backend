const IncidenciasController = require("../controllers/incidenciasController");
const authenticate = require("../middleware/authenticate");

module.exports = (app) => {
  app.post("/api/agregar-incidencia", authenticate, IncidenciasController.create);
  app.get("/api/obtener-incidencias", authenticate, IncidenciasController.getAll);
  app.get("/api/incidencia/:id", authenticate, IncidenciasController.getById);
  app.put("/api/incidencia/:id", authenticate, IncidenciasController.update);
  app.delete("/api/eliminar-incidencia/:id", authenticate, IncidenciasController.delete);
};