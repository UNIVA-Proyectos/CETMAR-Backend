const express = require("express");
const passport = require("passport");
const router = express.Router();
const docentesControllers = require("../controllers/docentesControllers");

// Obtener todos los docentes
router.get("/getAll", docentesControllers.getAllDocentes);

//Obtener un docente por ID sin JWT (solo para pruebas)
//router.get("/findById/:id", docentesControllers.findById);
//Obtener un docente por ID (jwt)
router.get(
"/findById/:id",
 passport.authenticate("jwt", { session: false }),
 docentesControllers.findById
);

// Crear un nuevo docente
router.post("/create", docentesControllers.register);


// Actualizar datos de un docente
router.put(
  "/update",
  passport.authenticate("jwt", { session: false }),
  docentesControllers.update
);

module.exports = router;
