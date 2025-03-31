const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const logger = require("morgan");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");

// Configura express-session
app.use(
  session({
    secret: "09876",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      sameSite: "lax",
    },
  })
);

//Instanciando rutas
const users = require("./routes/usersRoutes");
const docentes = require("./routes/docentesRoutes");

const port = process.env.PORT || 3000;

app.use(logger("dev"));
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

// Configuración de CORS
app.use(
  cors({
    origin: "http://localhost:3001", // URL del frontend
    credentials: true, // Permite credenciales
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(passport.initialize());
app.use(passport.session());
require("./config/passport")(passport);

app.disable("x-powered-by");

app.set("port", port);

// Usando las rutas
app.use(users);
app.use(docentes);

server.listen(port, "0.0.0.0", function () {
  console.log(
    "Aplicacion de Node.js " + process.pid + " iniciada en puerto " + port
  );
});

//ERROR HANDLING
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
};
