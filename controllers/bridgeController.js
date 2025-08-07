const Bridge = require("../models/bridge");

module.exports = {
  async syncUsuarios(req, res) {
    try {
      const { updated_since } = req.query;
      const usuarios = await Bridge.getUsuariosParaSync(updated_since);
      
      return res.status(200).json({
        success: true,
        count: usuarios.length,
        usuarios
      });
    } catch (error) {
      console.error("Error en syncUsuarios:", error);
      res.status(500).json({ 
        success: false,
        error: "Error interno del servidor" 
      });
    }
  },

  // Puede aceptar un solo log o un array de logs
  async guardarEntradaSalida(req, res) {
    try {
      let logs = req.body;
      
      // Convertir a array si es un objeto único
      if (!Array.isArray(logs)) logs = [logs];

      // Validaciones básicas
      if (logs.length === 0) {
        return res.status(400).json({ 
          success: false,
          error: "No se proporcionaron datos" 
        });
      }

      // Validar cada log
      for (const log of logs) {
        if (!log.alumno_id || typeof log.es_entrada !== 'boolean') {
          return res.status(400).json({
            success: false,
            error: "Cada log debe tener alumno_id y es_entrada (boolean)"
          });
        }
      }

      // Guardar en la base de datos
      const count = await Bridge.guardarEntradasSalidasLote(logs);
      
      res.status(201).json({ 
        success: true,
        message: `Se guardaron ${count} registros correctamente`,
        count 
      });

    } catch (error) {
      console.error("Error en guardarEntradaSalida:", error);
      res.status(500).json({ 
        success: false,
        error: "Error al guardar entradas/salidas",
        details: error.message 
      });
    }
  },
};
