const db = require("../config/config");

const Notificacion = {
  // Crear una notificación para un usuario
  create: ({ titulo, mensaje, usuario_id }) =>
    db.one(
      "INSERT INTO notificaciones (titulo, mensaje, usuario_id, leida, fecha) VALUES ($1, $2, $3, false, NOW()) RETURNING *",
      [titulo, mensaje, usuario_id]
    ),

  // Obtener notificaciones no leídas por usuario
  getNoLeidasByUser: (usuario_id) =>
    db.manyOrNone(
      "SELECT * FROM notificaciones WHERE usuario_id = $1 AND leida = false ORDER BY fecha DESC",
      [usuario_id]
    ),

  // Marcar una notificación como leída
  marcarLeida: (noti_id) =>
    db.none("UPDATE notificaciones SET leida = true WHERE id = $1", [noti_id]),
};

module.exports = Notificacion;
