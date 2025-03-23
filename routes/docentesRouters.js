const express = require("express");
const passport = require("passport");
const router = express.Router();
const docentesControllers = require("../controllers/docentesControllers");

// Obtener todos los docentes
router.get("/getAll", docentesControllers.getAllDocentes);

// Obtener un docente por ID (con autenticación JWT)
router.get(
  "/findById/:id",
  passport.authenticate("jwt", { session: false }),
  docentesControllers.findById
);

// Crear un nuevo docente
router.post("/create", docentesControllers.register);

// Inicio de sesión para docentes
router.post("/login", docentesControllers.login);

// Cerrar sesión de docente
router.post("/logout", docentesControllers.logout);

// Actualizar datos de un docente
router.put(
  "/update",
  passport.authenticate("jwt", { session: false }),
  docentesControllers.update
);

module.exports = router;
