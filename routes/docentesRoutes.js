const express = require("express");
const router = express.Router();
const docentesControllers = require("../controllers/docentesControllers");
const passport = require("passport");

// Obtener todos los docentes
router.get(
  "/api/docentes/getAll",
  passport.authenticate("jwt", { session: false }),
  docentesControllers.getAllDocentes
);

//Obtener un docente por ID (jwt)
router.get(
  "/api/docente/findById/:id",
  passport.authenticate("jwt", { session: false }),
  docentesControllers.findById
);

// Crear un nuevo docente
router.post(
  "/api/docente/create",
  passport.authenticate("jwt", { session: false }),
  docentesControllers.register
);

// Actualizar datos de un docente
router.put(
  "/api/docente/update",
  passport.authenticate("jwt", { session: false }),
  docentesControllers.update
);

module.exports = router;
