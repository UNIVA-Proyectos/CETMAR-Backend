const passport = require("passport");
const docentesControllers = require("../controllers/docentesControllers");

module.exports = (app) => {
  // Obtener todos los docentes
  app.get(
    "/api/docentes/getAll",
    passport.authenticate("jwt", { session: false }),
    docentesControllers.getAllDocentes
  );

  //Obtener un docente por ID (jwt)
  app.get(
    "/api/docente/findById/:id",
    passport.authenticate("jwt", { session: false }),
    docentesControllers.findById
  );

  // Crear un nuevo docente
  app.post(
    "/api/docente/create",
    passport.authenticate("jwt", { session: false }),
    docentesControllers.register
  );

  // Actualizar datos de un docente
  app.put(
    "/api/docente/update",
    passport.authenticate("jwt", { session: false }),
    docentesControllers.update
  );
};
