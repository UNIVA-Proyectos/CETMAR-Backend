const SystemConfigController = require("../controllers/sysConfigController");
const authenticate = require("../middleware/authenticate");
const requireRole = require("../middleware/requireRole");

module.exports = (app) => {
  app.get("/api/system-config/public", SystemConfigController.getPublicConfig);
  app.get(
    "/api/system-config/all",
    authenticate,
    requireRole(["admin"]),
    SystemConfigController.getAllConfig
  );
  app.put(
    "/api/system-config/batch",
    authenticate,
    requireRole(["admin"]),
    SystemConfigController.updateBatchConfig
  );
};
