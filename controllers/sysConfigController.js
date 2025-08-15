const db = require("../config/config");

const SysConfigController = {
  // 1. Obtener solo configuraciones públicas
  getPublicConfig: async (req, res) => {
    try {
      const configs = await db.manyOrNone(
        "SELECT config_key, config_value FROM system_config WHERE is_public = true"
      );
      const configObject = {};
      configs.forEach((config) => {
        configObject[config.config_key] = config.config_value;
      });
      res.json({ success: true, data: configObject });
    } catch (error) {
      console.error("Error al obtener configuración pública:", error);
      res
        .status(500)
        .json({ success: false, error: "Error interno del servidor" });
    }
  },

  // 2. Obtener toda la configuración (solo admin)
  getAllConfig: async (req, res) => {
    try {
      const configs = await db.manyOrNone(
        `SELECT sc.*, u.nombre AS updated_by_name
         FROM system_config sc
         LEFT JOIN usuarios u ON sc.updated_by = u.id
         ORDER BY sc.config_key`
      );
      res.json({ success: true, data: configs });
    } catch (error) {
      console.error("Error al obtener configuración:", error);
      res
        .status(500)
        .json({ success: false, error: "Error interno del servidor" });
    }
  },

  // 3. Actualizar configuraciones en batch (solo admin)
  updateBatchConfig: async (req, res) => {
    try {
      const { configs } = req.body;
      if (!Array.isArray(configs) || configs.length === 0) {
        return res.status(400).json({
          success: false,
          error: "configs debe ser un array no vacío",
        });
      }

      // Validación previa de todas las keys a editar
      for (const config of configs) {
        if (!config.key || typeof config.value === "undefined") {
          return res.status(400).json({
            success: false,
            error: "Cada configuración debe tener key y value",
          });
        }
        const configCheck = await db.oneOrNone(
          "SELECT is_editable FROM system_config WHERE config_key = $1",
          [config.key]
        );
        if (!configCheck) {
          return res.status(400).json({
            success: false,
            error: `Configuración '${config.key}' no encontrada`,
          });
        }
        if (!configCheck.is_editable) {
          return res.status(403).json({
            success: false,
            error: `La configuración '${config.key}' no se puede modificar por seguridad`,
          });
        }
      }

      // Actualización en batch
      const results = [];
      for (const config of configs) {
        const result = await db.result(
          "UPDATE system_config SET config_value = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE config_key = $3",
          [config.value, req.user.id, config.key]
        );
        results.push({
          key: config.key,
          value: config.value,
          updated: result.rowCount > 0,
        });
      }

      res.json({
        success: true,
        message: "Configuraciones actualizadas exitosamente",
        data: results,
      });
    } catch (error) {
      console.error("Error al actualizar configuraciones:", error);
      res
        .status(500)
        .json({ success: false, error: "Error interno del servidor" });
    }
  },
};

module.exports = SysConfigController;
