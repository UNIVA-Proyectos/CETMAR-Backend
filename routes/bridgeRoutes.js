const BridgeController = require("../controllers/bridgeController");
module.exports = (app) => {
  // Endpoint para sincronización de usuarios con terminales biométricas
  app.get("/api/bridge/sync", BridgeController.syncUsuarios);

  app.get("/api/bridge/sync/all", BridgeController.syncUsuariosAll);

  // Endpoint para guardar entradas y salidas desde el bridge
  app.post("/api/bridge/access-logs", BridgeController.guardarEntradaSalida);
};
