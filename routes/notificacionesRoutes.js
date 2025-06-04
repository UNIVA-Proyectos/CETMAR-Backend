const authenticate = require("../middleware/authenticate");
const Notificacion = require("../models/Notificacion");
const {
  enviarNotificacionPersonal,
} = require("../notifications/socketNotifications");

module.exports = (app, io) => {
  // Obtener notificaciones no leídas para el usuario autenticado
  app.get("/api/notificaciones/no-leidas", authenticate, async (req, res) => {
    try {
      const notis = await Notificacion.getNoLeidasByUser(req.user.id);
      res.json(notis);
    } catch (err) {
      res
        .status(500)
        .json({ success: false, message: "Error al obtener notificaciones" });
    }
  });

  // Endpoint para lanzar una notificación de prueba a usuario 339
  app.post("/api/notificaciones/prueba", async (req, res) => {
    try {
      const {
        titulo = "¡Notificación de prueba!",
        mensaje = "Esto es un mensaje de prueba para usuario 339.",
      } = req.body || {};
      await enviarNotificacionPersonal(io, 339, titulo, mensaje);
      res.json({
        success: true,
        message: "Notificación enviada a usuario 339",
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  // Marcar una notificación como leída
  app.patch("/api/notificaciones/:id/leida", authenticate, async (req, res) => {
    try {
      await Notificacion.marcarLeida(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res
        .status(500)
        .json({ success: false, message: "Error al marcar como leída" });
    }
  });
};
