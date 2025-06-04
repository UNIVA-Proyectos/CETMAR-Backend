const Notificacion = require("../models/Notificacion");

// Mapa para relacionar usuario_id con socketId (multi-socket support)
const userSockets = {};

/**
 * Llama esto en el archivo principal del servidor (server.js) después de crear io.
 * @param {Server} io - instancia de socket.io
 */
function setupSocketNotifications(io) {
  io.on("connection", (socket) => {
    socket.on("registrar_usuario", (usuarioId) => {
      if (!userSockets[usuarioId]) userSockets[usuarioId] = new Set();
      userSockets[usuarioId].add(socket.id);
      socket.usuarioId = usuarioId;
      console.log(
        `[SOCKET] Usuario ${usuarioId} conectado con socket ${socket.id}`
      );
    });

    socket.on("disconnect", () => {
      if (socket.usuarioId && userSockets[socket.usuarioId]) {
        userSockets[socket.usuarioId].delete(socket.id);
        if (userSockets[socket.usuarioId].size === 0)
          delete userSockets[socket.usuarioId];
      }
    });
  });
}

/**
 * Envía una notificación a un usuario específico y la guarda en BD.
 */
async function enviarNotificacionPersonal(io, usuarioId, titulo, mensaje) {
  await Notificacion.create({ titulo, mensaje, usuario_id: usuarioId });
  if (userSockets[usuarioId]) {
    for (const socketId of userSockets[usuarioId]) {
      io.to(socketId).emit("notificacion", { titulo, mensaje });
      console.log(
        `[SOCKET] Notificación enviada a usuario ${usuarioId}: ${titulo} - ${mensaje}`
      );
    }
  } else {
    console.log(
      `[SOCKET] Usuario ${usuarioId} no conectado. Notificación solo guardada en BD.`
    );
  }
}

module.exports = {
  setupSocketNotifications,
  enviarNotificacionPersonal,
};
