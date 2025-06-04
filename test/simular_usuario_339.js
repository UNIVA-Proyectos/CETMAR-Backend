const { io } = require("socket.io-client");

// Cambia la URL si tu backend está en otra dirección/puerto
const socket = io("http://localhost:3000", {
  withCredentials: true,
});

// Cuando la conexión esté lista, registra el usuario 339
socket.on("connect", () => {
  console.log("Conectado al servidor Socket.IO con id:", socket.id);
  socket.emit("registrar_usuario", 339);
  console.log("Usuario 339 registrado en el socket");
});

// Escucha notificaciones
socket.on("notificacion", (data) => {
  console.log("¡Notificación recibida para usuario 339!");
  console.log("Título:", data.titulo);
  console.log("Mensaje:", data.mensaje);
});

// Opcional: maneja desconexión
socket.on("disconnect", () => {
  console.log("Desconectado del servidor.");
});