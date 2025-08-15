const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const logger = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true,
  },
});

// Instanciando rutas
const users = require("./routes/usersRoutes");
const docentes = require("./routes/docentesRoutes");
const excel = require("./routes/importRoutes");
const alumno = require("./routes/alumnoRoutes");
const asistenciasRoutes = require("./routes/asistenciasRoutes");
const notificacionesRoutes = require("./routes/notificacionesRoutes");
const bridge = require("./routes/bridgeRoutes");
const incidencias = require("./routes/incidenciasRoutes");
const gruposRoutes = require("./routes/gruposRoutes");
const systemConfigRoutes = require("./routes/sysConfigRoutes");

const port = process.env.PORT || 3000;

app.use(logger("dev"));
app.use(express.json());
app.use(cookieParser());
app.use(
  express.urlencoded({
    extended: true,
  })
);

// Configuración de CORS
app.use(
  cors({
    origin: "http://localhost:3001", // URL del frontend
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.disable("x-powered-by");
app.set("port", port);

// Llamando a las rutas
users(app);
docentes(app);
excel(app);
alumno(app);
asistenciasRoutes(app);
bridge(app);
notificacionesRoutes(app, io);
incidencias(app);
gruposRoutes(app);
systemConfigRoutes(app);

server.listen(port, "0.0.0.0", function () {
  console.log(
    "Aplicación de Node.js " + process.pid + " iniciada en puerto " + port
  );
});

// ERROR HANDLING
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Error interno del servidor",
  });
});

module.exports = {
  app: app,
  server: server,
  io: io,
};
