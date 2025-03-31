const express = require("express");
const router = express.Router();
const asistenciasController = require("../controllers/asistenciasController");

// Ruta para registrar asistencia
router.post("/registrar", asistenciasController.registrarAsistencia);

module.exports = router;
